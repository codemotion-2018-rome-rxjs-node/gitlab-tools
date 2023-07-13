import { tap, concatMap, mergeMap, toArray } from "rxjs"
import { fetchAllGroupProjects } from "../../../internals/gitlab-functions/group.functions"
import { readProject, cloneProject } from "../../../internals/gitlab-functions/project.functions"
import { Config } from "../../../internals/config"

export function cloneGroupProjects(gitLabUrl: string, token: string, groupId: string, outdir: string) {
    let numProject = 0
    return fetchAllGroupProjects(gitLabUrl, token, groupId).pipe(
        tap(projects => {
            numProject = projects.length
            console.log(`====>>>> number of projects read`, numProject)
        }),
        concatMap(projects => projects),
        mergeMap((project: any) => {
            return readProject(gitLabUrl, token, project.id)
        }, Config.concurrency),
        mergeMap((projectCompact) => {
            return cloneProject(projectCompact, outdir)
        }, Config.concurrency),
        toArray(),
        tap(repos => {
            console.log(`====>>>> cloned ${repos.length} repos in folder ${outdir}`)
            console.log(`====>>>> FAILED to clone ${numProject - repos.length} repos`)
        }),
    )
}