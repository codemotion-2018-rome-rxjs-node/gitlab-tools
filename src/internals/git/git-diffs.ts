import { concatMap } from "rxjs"
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