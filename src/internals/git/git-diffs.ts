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
            const upstream_repo_tag_or_branch = fromToParams.to_tag_or_branch
            const fork_tag_or_branch = fromToParams.from_tag_or_branch
            // `git diff base/${upstream_repo_tag_or_branch} origin/${fork_tag_or_branch} -- <File>`
            const secondCommand = `git`
            const args = ['diff', `remotes/base/${upstream_repo_tag_or_branch}`, `remotes/origin/${fork_tag_or_branch}`, '--', file]

            const options = {
                cwd: projectDir
            }
            return executeCommandNewProcessObs(
                'run git diff', secondCommand, args, options, executedCommands
            )
        }),
        // reduce the output of the git diff command, which can be a buffer in case of a long diff story, to a single string
        reduce((acc, curr) => acc + curr, '')
    )
}