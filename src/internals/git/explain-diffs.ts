import { of, catchError, map } from "rxjs"
import { getFullCompletion$ } from "../openai/openai"
import { ExplainDiffPromptTemplateData, fillPromptTemplateExplainDiff } from "../openai/prompt-templates"


export type PromptTemplates = {
    changedFile: string,
    removedFile: string,
    addedFile: string,
}
export type FileInfo = {
    extension: string
    deleted: boolean | null
    added: boolean | null
    copied: boolean | null
    renamed: boolean | null
    File: string
    fullFilePath: string
}
export type ExplanationInput = FileInfo & {
    fileContent: string
    diffLines: string
}

export type ExplanationRec = FileInfo & {
    explanation: string
}
// The type returned by explanationsFromComparisonResult$ is this
// Omit<T & FileInfo & {
//     explanation: string | null;
//     fileContent: string;
//     diffLines: string;
// }, "fileContent" | "diffLines">
// 
// which means that it returns an object that is T & FileInfo & {explanation: string | null}
// since it omits the properties 'fileContent' and 'diffLines'
export function explainGitDiffs$<T>(
    explanationInput: T & ExplanationInput, promptTemplates: PromptTemplates, executedCommands: string[]
) {
    let language = ''
    // if the extension is .java, we can assume that the language is java
    // if the extension is .ts, we can assume that the language is TypeScript
    // Use a switch statement to handle other languages
    switch (explanationInput.extension) {
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
    if (explanationInput.deleted) {
        promptTemplate = promptTemplates.removedFile
    } else if (explanationInput.added) {
        promptTemplate = promptTemplates.addedFile
    } else {
        promptTemplate = promptTemplates.changedFile
    }
    if (promptTemplate === '') {
        let fileStatus = ''
        if (explanationInput.copied) {
            fileStatus = 'copied'
        } else if (explanationInput.renamed) {
            fileStatus = 'renamed'
        }
        const rec = {
            ...explanationInput,
            explanation: `explanations are only for changed, added or removed files - this file is ${fileStatus}`
        }
        return of(rec)
    }
    const promptData: ExplainDiffPromptTemplateData = {
        language,
        fileName: explanationInput.File,
        fileContent: explanationInput.fileContent,
        diffs: explanationInput.diffLines,
    }
    const prompt = fillPromptTemplateExplainDiff(promptTemplate, promptData)
    console.log(`Calling LLM to explain diffs for file ${explanationInput.fullFilePath}`)
    return getFullCompletion$(prompt).pipe(
        catchError(err => {
            const errMsg = `===>>> Error calling LLM to explain diffs for file ${explanationInput.fullFilePath} - ${err.message}`
            console.log(errMsg)
            executedCommands.push(errMsg)
            return of('error in calling LLM to explain diffs')
        }),
        map(explanation => {
            const command = `call openai to explain diffs for file ${explanationInput.fullFilePath}`
            executedCommands.push(command)
            return { ...explanationInput, explanation }
        }),
        map(rec => {
            // remove the file content and the diffLines to avoid writing it to the json file
            // this is shown in the type assigned to _rec, which is
            // Omit<T & FileInfo & {
            //     explanation: string | null;
            //     fileContent: string;
            //     diffLines: string;
            // }, "fileContent" | "diffLines">
            // 
            // which means that it returns a new object that is the same as T & FileInfo & {explanation: string | null}
            // since it omits the properties 'fileContent' and 'diffLines'
            const { fileContent, diffLines, ..._rec } = rec
            return _rec
        })
    )
}