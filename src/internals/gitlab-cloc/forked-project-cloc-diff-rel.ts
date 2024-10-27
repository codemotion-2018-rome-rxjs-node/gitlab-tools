import path from "path"
import { executeCommandNewProcessObs, executeCommandNewProcessToLinesObs, executeCommandObs$ } from "../execute-command/execute-command"
import { catchError, concatMap, of, filter, EMPTY, toArray, tap, skip, startWith, map } from "rxjs"
import { convertHttpsToSshUrl } from "../gitlab/project"
import { compareForksWithUpstreamInGroup$ } from "../gitlab/compare-forks"
import { readGroup$ } from "../gitlab/group"
import { readLinesObs, writeFileObs } from "observable-fs"
import { fromCsvObs, toCsvObs } from "@enrico.piccinin/csv-tools"

//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */

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
export function compareForksInGroupWithUpstreamClocGitDiffRelByFile$(
    gitLabUrl: string,
    token: string,
    groupId: string,
    groupName: string,
    projectsWithNoChanges: string[],
    repoRootFolder: string,
    executedCommands: string[],
    languages?: string[]
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
            return clocDiffRelFromComparisonResult$(comparisonResult, repoRootFolder, executedCommands, languages)
        }),
    )
}

export function writeCompareForksInGroupWithUpstreamClocGitDiffRelByFile$(
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
            return compareForksInGroupWithUpstreamClocGitDiffRelByFile$(
                gitLabUrl, token, groupId, groupName, projectsWithNoChanges, repoRootFolder, executedCommands, languages
            )
        }),
        toCsvObs(),
        toArray(),
        concatMap((compareResult) => {
            const outFile = path.join(outdir, `${groupName}-compare-with-upstream-cloc-diff-rel-${timeStampYYYYMMDDHHMMSS}.csv`);
            return writeCompareResultsToCsv$(compareResult, groupName, outFile)
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

export type AllDiffsRec = ClocDiffRec & {
    diffLines: string,
    fileContent: string
}
export function compareForksInGroupWithUpstreamAllDiffs$(
    gitLabUrl: string,
    token: string,
    groupId: string,
    groupName: string,
    projectsWithNoChanges: string[],
    repoRootFolder: string,
    executedCommands: string[],
    languages?: string[]
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

//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes

export type ComparisonResult = {
    project_name: string
    upstream_url_to_repo?: string
    from_tag_branch_commit: string
    to_tag_branch_commit: string
}
export function clocDiffRelFromComparisonResult$(
    comparisonResult: ComparisonResult, repoRootFolder: string, executedCommands: string[], languages?: string[]
) {
    // the project_name_with_namespace is in the format group / subgroup / project
    // we want to turn this into a directory split by '/' and then join the various parts with the projectDir
    const projectDirParts = comparisonResult.project_name.split('/')
    let projectDir = ''
    for (let i = 0; i < projectDirParts.length; i++) {
        projectDir = path.join(projectDir, projectDirParts[i].trim())
    }
    projectDir = path.join(repoRootFolder, projectDir)

    const header = 'File,blank_same,blank_modified,blank_added,blank_removed,comment_same,comment_modified,comment_added,comment_removed,code_same,code_modified,code_added,code_removed'
    return clocDiffRel$(
        projectDir,
        {
            from_tag_or_branch: comparisonResult.from_tag_branch_commit,
            to_tag_or_branch: comparisonResult.to_tag_branch_commit,
            upstream_url_to_repo: comparisonResult.upstream_url_to_repo,
            languages
        },
        executedCommands
    ).pipe(
        filter(line => line.trim().length > 0),
        // skip the first line which is the header line
        // File, == blank, != blank, + blank, - blank, == comment, != comment, + comment, - comment, == code, != code, + code, - code, "github.com/AlDanial/cloc v 2.00 T=0.0747981071472168 s"
        skip(1),
        // start with the header line that we want to have
        startWith(header),
        map(line => {
            // remove trailing comma without using regular expressions
            const _line = line.trim()
            if (_line.endsWith(',')) {
                return _line.slice(0, -1)
            }
            return _line
        }),
        fromCsvObs<ClocDiffRec>(','),
        map(rec => {
            const fullFilePath = path.join(projectDir, rec.File)
            const extension = path.extname(fullFilePath)
            const recWithPojectDir = { ...rec, projectDir, fullFilePath, extension }
            return recWithPojectDir
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
                    return { ...rec, diffLines }
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
                        return of({ ...rec, fileContent: 'file deleted' } as AllDiffsRec)
                    }
                    throw err
                })
            )
        })
    )
}


export function clocDiffRel$(
    projectDir: string,
    fromToParams: { from_tag_or_branch: string, to_tag_or_branch: string, upstream_url_to_repo?: string, languages?: string[] },
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
}


export function cdToProjectDirAndAddRemote$(
    projectDir: string,
    fromToParams: { upstream_url_to_repo?: string },
    executedCommands: string[]
) {
    const baseRemoteName = 'base'
    const upstream_url_to_repo = fromToParams.upstream_url_to_repo
    let commandIfRemoteExists = ''
    if (upstream_url_to_repo) {
        // convert to ssh url to avoid password prompts
        const sshUrl = convertHttpsToSshUrl(upstream_url_to_repo)
        commandIfRemoteExists = ` && git remote add ${baseRemoteName} ${sshUrl} && git fetch base`
    }
    const command = `cd ${projectDir}${commandIfRemoteExists}`

    return executeCommandObs$('cd to project directory and add base remote', command, executedCommands).pipe(
        catchError((err) => {
            // if the remote base already exists, we can ignore the error
            if (err.message.includes(`remote ${baseRemoteName} already exists`)) {
                return of(null)
            }
            // if the project directory does not exist, we can ignore the error
            // it may be that thre is a new forked project in gitlab which has not been cloned yet
            // in this case we can ignore the error but complete the observable to avoid that the
            // next observable in the chain executes the cloc command
            if (err.message.includes(`Command failed: cd`)) {
                console.log(`Project directory ${projectDir} does not exist`)
                executedCommands.push(`===>>> Error: Project directory ${projectDir} does not exist`)
                return EMPTY
            }
            throw (err)
        }),
    )
}

const writeCompareResultsToCsv$ = (compareResults: any[], group: string, outFile: string) => {
    return writeFileObs(outFile, compareResults)
        .pipe(
            tap({
                next: () => console.log(`====>>>> Fork compare result for Group ${group} written in csv file: ${outFile}`),
            }),
        );
}

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

const writeProjectsWithNoChanges$ = (projectsWithNoChanges: string[], group: string, outFile: string) => {
    return writeFileObs(outFile, projectsWithNoChanges)
        .pipe(
            tap({
                next: () => console.log(`====>>>> Forks with no commits for Group ${group} written in csv file: ${outFile}`),
            }),
        );
}

const writeExecutedCommands$ = (executedCommands: string[], group: string, outFile: string) => {
    return writeFileObs(outFile, executedCommands)
        .pipe(
            tap({
                next: () => console.log(`====>>>> Command executed to calculate fork diffs for group "${group}" written in csv file: ${outFile}`),
            }),
        );
}