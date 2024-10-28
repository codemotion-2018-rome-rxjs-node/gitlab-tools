import { of, catchError, map } from "rxjs"
import { FileDiffWithGitDiffsAndFileContent, PromptTemplates } from "../gitlab-cloc/forked-project-cloc-diff-rel"
import { getFullCompletion$ } from "../openai/openai"
import { ExplainDiffPromptTemplateData, fillPromptTemplateExplainDiff } from "../openai/prompt-templates"


export function explanationsFromComparisonResult$(
    allDiffsRec: FileDiffWithGitDiffsAndFileContent, promptTemplates: PromptTemplates, executedCommands: string[]
) {
    let language = ''
    // if the extension is .java, we can assume that the language is java
    // if the extension is .ts, we can assume that the language is TypeScript
    // Use a switch statement to handle other languages
    switch (allDiffsRec.extension) {
        case '.java':
            language = 'java'
            break
        case '.ts':
            language = 'TypeScript'
            break
        default:
            language = ''
    }

    let promptTemplate = ''
    if (allDiffsRec.deleted) {
        promptTemplate = promptTemplates.removedFile
    } else if (allDiffsRec.added) {
        promptTemplate = promptTemplates.addedFile
    } else {
        promptTemplate = promptTemplates.changedFile
    }
    if (promptTemplate === '') {
        let fileStatus = ''
        if (allDiffsRec.copied) {
            fileStatus = 'copied'
        } else if (allDiffsRec.renamed) {
            fileStatus = 'renamed'
        }
        const rec = {
            ...allDiffsRec,
            explanation: `explanations are only for changed, added or removed files - this file is ${fileStatus}`
        }
        return of(rec)
    }
    const promptData: ExplainDiffPromptTemplateData = {
        language,
        fileName: allDiffsRec.File,
        fileContent: allDiffsRec.fileContent,
        diffs: allDiffsRec.diffLines,
    }
    const prompt = fillPromptTemplateExplainDiff(promptTemplate, promptData)
    console.log(`Calling LLM to explain diffs for file ${allDiffsRec.fullFilePath}`)
    return getFullCompletion$(prompt).pipe(
        catchError(err => {
            const errMsg = `===>>> Error calling LLM to explain diffs for file ${allDiffsRec.fullFilePath} - ${err.message}`
            console.log(errMsg)
            executedCommands.push(errMsg)
            return of('error in calling LLM to explain diffs')
        }),
        map(explanation => {
            const command = `call openai to explain diffs for file ${allDiffsRec.fullFilePath}`
            executedCommands.push(command)
            return { ...allDiffsRec, explanation }
        }),
        map(rec => {
            // remove the file content and the diffLines to avoid writing it to the json file
            const { fileContent, diffLines, ..._rec } = rec
            return _rec
        })
    )
}