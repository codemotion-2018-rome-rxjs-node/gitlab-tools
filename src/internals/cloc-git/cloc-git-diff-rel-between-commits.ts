import { fromCsvObs } from "@enrico.piccinin/csv-tools"
import path from "path"
import { filter, skip, startWith, map, concatMap, catchError, of } from "rxjs"
import { executeCommandNewProcessToLinesObs } from "../execute-command/execute-command"
import { cdToProjectDirAndAddRemote$ } from "../git/add-remote"
import { readLinesObs } from "observable-fs"
import { gitDiff$ } from "../git/git-diffs"
import { FileDiffWithGitDiffsAndFileContent } from "../gitlab-cloc/forked-project-cloc-diff-rel"


export type ClocGitDiffRec = {
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

export type ComparisonParams = {
    project_name: string
    from_tag_branch_commit: string
    to_tag_branch_commit: string
    upstream_url_to_repo?: string
}
export function clocDiffRelFromComparisonResult$(
    comparisonParams: ComparisonParams, repoRootFolder: string, executedCommands: string[], languages?: string[]
) {
    // the project_name_with_namespace is in the format group / subgroup / project
    // we want to turn this into a directory split by '/' and then join the various parts with the projectDir
    const projectDirParts = comparisonParams.project_name.split('/')
    let projectDir = ''
    for (let i = 0; i < projectDirParts.length; i++) {
        projectDir = path.join(projectDir, projectDirParts[i].trim())
    }
    projectDir = path.join(repoRootFolder, projectDir)

    const header = 'File,blank_same,blank_modified,blank_added,blank_removed,comment_same,comment_modified,comment_added,comment_removed,code_same,code_modified,code_added,code_removed'
    return clocDiffRel$(
        projectDir,
        {
            from_tag_or_branch: comparisonParams.from_tag_branch_commit,
            to_tag_or_branch: comparisonParams.to_tag_branch_commit,
            upstream_url_to_repo: comparisonParams.upstream_url_to_repo,
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
        fromCsvObs<ClocGitDiffRec>(','),
        map(rec => {
            const fullFilePath = path.join(projectDir, rec.File)
            const extension = path.extname(fullFilePath)
            const recWithPojectDir = { ...rec, projectDir, fullFilePath, extension }
            return recWithPojectDir
        })
    )
}

export function allDiffsFromComparisonResult$(
    comparisonParams: ComparisonParams, repoRootFolder: string, executedCommands: string[], languages?: string[]
) {
    return clocDiffRelFromComparisonResult$(comparisonParams, repoRootFolder, executedCommands, languages).pipe(
        concatMap(rec => {
            console.log(`Calculating git diff for ${rec.fullFilePath}`)
            return gitDiff$(
                rec.projectDir!,
                {
                    from_tag_or_branch: comparisonParams.from_tag_branch_commit,
                    to_tag_or_branch: comparisonParams.to_tag_branch_commit,
                    upstream_url_to_repo: comparisonParams.upstream_url_to_repo
                },
                rec.File,
                executedCommands
            ).pipe(
                map(bufferDiffLines => {
                    const diffLines = bufferDiffLines.toString()
                    const _lines = diffLines.split('\n')
                    const secondLine = _lines[1]
                    const _rec: FileDiffWithGitDiffsAndFileContent = {
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
                    return { ...rec, fileContent: lines.join('\n') } as FileDiffWithGitDiffsAndFileContent
                }),
                catchError(err => {
                    if (err.code === 'ENOENT') {
                        return of({ ...rec, fileContent: 'file not found' } as FileDiffWithGitDiffsAndFileContent)
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
