import { concatMap, reduce } from "rxjs"
import { executeCommandNewProcessObs } from "../execute-command/execute-command"
import { cdToProjectDirAndAddRemote$ } from "./add-remote"

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
            const to_tag_branch_commit = fromToParams.to_tag_or_branch
            const from_tag_branch_commit = fromToParams.from_tag_or_branch
            // `git diff base/${upstream_repo_tag_or_branch} origin/${fork_tag_or_branch} -- <File>`
            const command = `git`
            const compareWithRemote = fromToParams.upstream_url_to_repo ? true : false
            const prefixes = toFromTagBranchCommitPrefix(to_tag_branch_commit, from_tag_branch_commit, compareWithRemote)
            const args = [
                'diff',
                `${prefixes.toTagBranchCommitPrefix}${to_tag_branch_commit}`,
                `${prefixes.fromTagBranchCommitPrefix}${from_tag_branch_commit}`,
                '--',
                file
            ]

            console.log(`running git diff ${args.join(' ')}`)

            const options = {
                cwd: projectDir
            }
            return executeCommandNewProcessObs(
                'run git diff', command, args, options, executedCommands
            )
        }),
        // reduce the output of the git diff command, which can be a buffer in case of a long diff story, to a single string
        reduce((acc, curr) => acc + curr, '')
    )
}

export function toFromTagBranchCommitPrefix(toTagBranchCommit: string, fromTagBranchCommit: string, compareWithRemote = false) {
    const base_or_origin_for_to_tagBranchCommit = compareWithRemote ? 'base/' : 'origin/'
    const resp = {
        toTagBranchCommitPrefix: `${base_or_origin_for_to_tagBranchCommit}`,
        fromTagBranchCommitPrefix: 'origin/'
    }
    if (toTagBranchCommit.startsWith('tags/')) {
        resp.toTagBranchCommitPrefix = `refs/`
    }
    if (fromTagBranchCommit.startsWith('tags/')) {
        resp.fromTagBranchCommitPrefix = `refs/`
    }
    return resp
}