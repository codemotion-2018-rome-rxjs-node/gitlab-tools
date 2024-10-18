import { tap, mergeMap, toArray } from "rxjs"
import { fetchAllGroupProjects$ } from "../../../internals/gitlab/group"
import { cloneProject$ } from "../../../internals/gitlab/project"
import { CONFIG } from "../../../internals/config"

export function cloneGroupProjects(gitLabUrl: string, token: string, groupId: string, outdir: string) {
    return fetchAllGroupProjects$(gitLabUrl, token, groupId).pipe(
        mergeMap((projectCompact) => {
            return cloneProject$(projectCompact, outdir)
        }, CONFIG.CONCURRENCY),
        toArray(),
        tap(repos => {
            console.log(`====>>>> cloned ${repos.length} repos in folder ${outdir}`)
            // console.log(`====>>>> FAILED to clone ${numProject - repos.length} repos`)
        }),
    )
}