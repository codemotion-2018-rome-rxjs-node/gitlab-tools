import { concatMap, map, tap } from "rxjs"
import { runPagedCommand} from "./paged-command"
import { readProject$ } from "./project"

export function getCommits$(gitLabUrl: string, token: string, projectId: string, stop?: (input: any) => boolean) {
    console.log(`====>>>> reading all commits for project: ${projectId}`)
    const command = `https://${gitLabUrl}/api/v4/projects/${projectId}/repository/commits?per_page=100`
    return runPagedCommand(command, token, 'commits', stop).pipe(
        tap(commits => {
            console.log(`====>>>> number of commits read from GitLab: `, commits.length)
        }),
    )
}

export function getFirstCommit$(gitLabUrl: string, token: string, projectId: string) {
    return getCommits$(gitLabUrl, token, projectId).pipe(
        map(commits => {
            // sort by date
            commits.sort((a: any, b: any) => {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            })
            return commits[0]
        })
    )
}


// in case of forked projects, the first commit is the first commit of the upstream project
// this is because when the fork is created, the forked project is created with the same commits as the upstream project
// with this function we retun the first commit after the fork was created
export function getFirstCommitSinceCreation$(gitLabUrl: string, token: string, projectId: string) {
    return readProject$(gitLabUrl, token, projectId).pipe(
        concatMap(project => {
            const creationDate = new Date(project.created_at)

            const stop = (commits: any[]) => {
                const firstCommit = commits[commits.length - 1]
                return new Date(firstCommit.created_at) < creationDate
            }

            return getCommits$(gitLabUrl, token, projectId, stop).pipe(
                map((commits) => {
                    const creationDate = new Date(project.created_at)
                    // find the first commit after the creation date
                    // sort the commits by date ascending (the first commit is the oldest)
                    commits.sort((a: any, b: any) => {
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    })
                    const firstCommit = commits.find((commit: any) => {
                        return new Date(commit.created_at) > creationDate
                    })
                    return firstCommit
                })
            )
        })
    )
}