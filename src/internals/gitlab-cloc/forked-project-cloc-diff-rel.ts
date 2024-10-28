import { executeCommandNewProcessObs, executeCommandNewProcessToLinesObs, executeCommandObs$ } from "../execute-command/execute-command"
import { catchError, concatMap, of, filter, EMPTY, toArray, tap, skip, startWith, map, mergeMap } from "rxjs"
import { readLinesObs, writeFileObs } from "observable-fs"
import { ExplainDiffPromptTemplateData, fillPromptTemplateExplainDiff } from "../openai/prompt-templates"
import { getFullCompletion$ } from "../openai/openai"
export type ClocDiffRec = {
    File: string
    blank_same: string
    blank_modified: string
    blank_added: string
    blank_removed: string
    comment_same: string
    comment_modified: string
    comment_added: string
    comment_removed: string
    code_same: string
    code_modified: string
    code_added: string
    code_removed: string,
    projectDir?: string,
    fullFilePath?: string
    extension?: string
}
export type AllDiffsRec = ClocDiffRec & {
    diffLines: string,
    fileContent: string,
    deleted: null | boolean,
    added: null | boolean,
    copied: null | boolean,
    renamed: null | boolean,
}
export function compareForksInGroupWithUpstreamAllDiffs$(
    gitLabUrl: string,
    token: string,
    groupId: string,
    groupName: string,
    projectsWithNoChanges: string[],
    repoRootFolder: string,
    executedCommands: string[],
    languages?: string[],
) {
    return compareForksWithUpstreamInGroup$(gitLabUrl, token, groupId, groupName).pipe(
        filter(comparisonResult => {
            if (comparisonResult.diffs.length === 0) {
                projectsWithNoChanges.push(comparisonResult.project_name!)
                console.log(`Project ${comparisonResult.project_name} has no changes`)
                return false
            }
            return true
        }),
        concatMap(comparisonResult => {
            return allDiffsFromComparisonResult$(comparisonResult, repoRootFolder, executedCommands, languages)
        }),
    )
}

export function writeCompareForksInGroupWithUpstreamAllDiffs$(
    gitLabUrl: string,
    token: string,
    groupId: string,
    repoRootFolder: string,
    outdir: string,
    languages?: string[]
) {
    const projectsWithNoChanges: string[] = []
    let groupName: string

    const timeStampYYYYMMDDHHMMSS = new Date().toISOString().replace(/:/g, '-').split('.')[0]

    const executedCommands: string[] = []

    return readGroup$(gitLabUrl, token, groupId).pipe(
        concatMap(group => {
            groupName = group.name
            return compareForksInGroupWithUpstreamAllDiffs$(
                gitLabUrl, token, groupId, groupName, projectsWithNoChanges, repoRootFolder, executedCommands, languages
            )
        }),
        toArray(),
        concatMap((compareResult) => {
            const outFile = path.join(outdir, `${groupName}-compare-with-upstream-all-diffs-${timeStampYYYYMMDDHHMMSS}.json`);
            return writeCompareResultsToJson$(compareResult, groupName, outFile)
        }),
        concatMap(() => {
            const outFile = path.join(outdir, `${groupName}-projects-with-no-changes-${timeStampYYYYMMDDHHMMSS}.txt`);
            return writeProjectsWithNoChanges$(projectsWithNoChanges, groupName, outFile)
        }),
        concatMap(() => {
            const outFile = path.join(outdir, `${groupName}-executed-commands-${timeStampYYYYMMDDHHMMSS}.txt`);
            return writeExecutedCommands$(executedCommands, groupName, outFile)
        })
    )
}

export type DiffsWithExplanationRec = AllDiffsRec & {
    explanation: string,
}
export type PromptTemplates = {
    changedFile: string,
    removedFile: string,
    addedFile: string,
}
export function compareForksInGroupWithUpstreamExplanation$(
    gitLabUrl: string,
    token: string,
    groupId: string,
    groupName: string,
    promptTemplates: PromptTemplates,
    repoRootFolder: string,
    projectsWithNoChanges: string[],
    executedCommands: string[],
    languages?: string[],
    concurrentLLMCalls = 5
) {
    return compareForksInGroupWithUpstreamAllDiffs$(
        gitLabUrl,
        token,
        groupId,
        groupName,
        projectsWithNoChanges,
        repoRootFolder,
        executedCommands,
        languages
    ).pipe(
        mergeMap(comparisonResult => {
            return explanationsFromComparisonResult$(comparisonResult, promptTemplates, executedCommands)
        }, concurrentLLMCalls),
    )
}

export function writeCompareForksInGroupWithUpstreamExplanation$(
    gitLabUrl: string,
    token: string,
    groupId: string,
    promptTemplates: PromptTemplates,
    repoRootFolder: string,
    outdir: string,
    languages?: string[]
) {
    const projectsWithNoChanges: string[] = []
    let groupName: string

    const timeStampYYYYMMDDHHMMSS = new Date().toISOString().replace(/:/g, '-').split('.')[0]

    const executedCommands: string[] = []

    return readGroup$(gitLabUrl, token, groupId).pipe(
        concatMap(group => {
            groupName = group.name
            return compareForksInGroupWithUpstreamExplanation$(
                gitLabUrl, token, groupId, groupName, promptTemplates, repoRootFolder, projectsWithNoChanges, executedCommands, languages
            )
        }),
        toArray(),
        concatMap((compareResult) => {
            const outFile = path.join(outdir, `${groupName}-compare-with-upstream-explanations-${timeStampYYYYMMDDHHMMSS}.json`);
            return writeCompareResultsToJson$(compareResult, groupName, outFile)
        }),
        concatMap(() => {
            const outFile = path.join(outdir, `${groupName}-projects-with-no-changes-${timeStampYYYYMMDDHHMMSS}.txt`);
            return writeProjectsWithNoChanges$(projectsWithNoChanges, groupName, outFile)
        }),
        concatMap(() => {
            const outFile = path.join(outdir, `${groupName}-executed-commands-${timeStampYYYYMMDDHHMMSS}.txt`);
            return writeExecutedCommands$(executedCommands, groupName, outFile)
        })
    )
}

export function allDiffsFromComparisonResult$(
    comparisonResult: ComparisonResult, repoRootFolder: string, executedCommands: string[], languages?: string[]
) {
    return clocDiffRelFromComparisonResult$(comparisonResult, repoRootFolder, executedCommands, languages).pipe(
        concatMap(rec => {
            console.log(`Calculating git diff for ${rec.fullFilePath}`)
            return gitDiff$(
                rec.projectDir!,
                {
                    from_tag_or_branch: comparisonResult.from_tag_branch_commit,
                    to_tag_or_branch: comparisonResult.to_tag_branch_commit,
                    upstream_url_to_repo: comparisonResult.upstream_url_to_repo
                },
                rec.File,
                executedCommands
            ).pipe(
                map(bufferDiffLines => {
                    const diffLines = bufferDiffLines.toString()
                    const _lines = diffLines.split('\n')
                    const secondLine = _lines[1]
                    const _rec: AllDiffsRec = {
                        ...rec, diffLines, fileContent: '', deleted: null, added: null, copied: null, renamed: null
                    }
                    if (secondLine.startsWith('deleted file mode')) {
                        _rec.deleted = true
                    } else if (secondLine.startsWith('new file mode')) {
                        _rec.added = true
                    } else if (secondLine.startsWith('copy ')) {
                        _rec.copied = true
                    } else if (secondLine.startsWith('rename ')) {
                        _rec.renamed = true
                    }
                    return { ..._rec, diffLines }
                })
            )
        }),
        concatMap(rec => {
            return readLinesObs(rec.fullFilePath!).pipe(
                map(lines => {
                    return { ...rec, fileContent: lines.join('\n') } as AllDiffsRec
                }),
                catchError(err => {
                    if (err.code === 'ENOENT') {
                        return of({ ...rec, fileContent: 'file not found' } as AllDiffsRec)
                    }
                    throw err
                })
            )
        })
    )
}

export function clocDiffRel$(
    fromToParams: { from_tag_or_branch: string, to_tag_or_branch: string, upstream_url_to_repo?: string, languages?: string[] },
    executedCommands: string[]
    return cdToProjectDirAndAddRemote$(
        projectDir,
        fromToParams,
        executedCommands
    ).pipe(
        concatMap(() => {
            const upstream_repo_tag_or_branch = fromToParams.to_tag_or_branch
            const fork_tag_or_branch = fromToParams.from_tag_or_branch
            // `cloc --git-diff-rel --csv --by-file base/${upstream_repo_tag_or_branch} origin/${fork_tag_or_branch}`
            const secondCommand = `cloc`
            const args = ['--git-diff-rel', '--csv', '--by-file', `base/${upstream_repo_tag_or_branch}`, `origin/${fork_tag_or_branch}`]

            if (fromToParams.languages && fromToParams.languages?.length > 0) {
                const languagesString = fromToParams.languages.join(',');
                args.push(`--include-lang=${languagesString}`);
            }
            const options = {
                cwd: projectDir
            }
            return executeCommandNewProcessToLinesObs(
                'run cloc --git-diff-rel --csv --by-file', secondCommand, args, options, executedCommands
            )
        })
    )
}

export function gitDiff$(
    projectDir: string,
    fromToParams: { from_tag_or_branch: string, to_tag_or_branch: string, upstream_url_to_repo?: string },
    file: string,
    executedCommands: string[]
) {
    return cdToProjectDirAndAddRemote$(
        projectDir,
        fromToParams,
        executedCommands
    ).pipe(
        concatMap(() => {
            const upstream_repo_tag_or_branch = fromToParams.to_tag_or_branch
            const fork_tag_or_branch = fromToParams.from_tag_or_branch
            // `git diff base/${upstream_repo_tag_or_branch} origin/${fork_tag_or_branch} -- <File>`
            const secondCommand = `git`
            const args = ['diff', `base/${upstream_repo_tag_or_branch}`, `origin/${fork_tag_or_branch}`, '--', file]

            const options = {
                cwd: projectDir
            }
            return executeCommandNewProcessObs(
                'run git diff', secondCommand, args, options, executedCommands
            )
        })
    )
export function cdToProjectDirAndAddRemote$(
    fromToParams: { upstream_url_to_repo?: string },
    const command = `cd ${projectDir}${commandIfRemoteExists}`
    return executeCommandObs$('cd to project directory and add base remote', command, executedCommands).pipe(
    )
}
export function explanationsFromComparisonResult$(
    allDiffsRec: AllDiffsRec, promptTemplates: PromptTemplates, executedCommands: string[]
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
const writeCompareResultsToJson$ = (compareResults: any[], group: string, outFile: string) => {
    // dump compareResults as a json string
    const jsonArray = JSON.stringify(compareResults, null, 2)
    return writeFileObs(outFile, [jsonArray])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Fork compare result for Group ${group} written in json file: ${outFile}`),
            }),
        );
}
