import { filter } from "rxjs"
import { fetchAllGroupProjects$ } from "./group"

export function readForkedProjectsForGroup$(gitLabUrl: string, token: string, groupId: string, groupName?: string) {
    return fetchAllGroupProjects$(gitLabUrl, token, groupId, groupName).pipe(
        filter(project => {
            return project.forked_from_project !== undefined
        }),
    )
}