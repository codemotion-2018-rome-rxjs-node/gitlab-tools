import { catchError, of, EMPTY } from "rxjs"
import { executeCommandObs$ } from "../execute-command/execute-command"
import { convertHttpsToSshUrl } from "./convert-ssh-https-url"


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
        commandIfRemoteExists = ` && git remote add ${baseRemoteName} ${sshUrl} && git fetch --all --tags`
    }
    const command = `cd ${projectDir} && git fetch origin ${commandIfRemoteExists}`

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