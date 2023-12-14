import axios from "axios"
import { concatMap, from, map, tap } from "rxjs"
import { GroupCompact } from "./group.model"
import { runPagedCommand } from "./paged-command"

export function readGroup$(gitLabUrl: string, token: string, groupId: string) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}`
    return from(axios.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe(
        map(resp => {
            return resp.data as GroupCompact
        })
    )
}

export function fetchGroupDescendantGroups(gitLabUrl: string, token: string, groupId: string) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}/descendant_groups`
    return from(axios.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })).pipe(
        map(resp => {
            return resp.data
        })
    )
}

export function fetchAllGroupProjects$(gitLabUrl: string, token: string, groupId: string, includeArchived = false) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}/projects?include_subgroups=true&per_page=100`
    return runPagedCommand(command, token).pipe(
        map(resp => {
            const projects = includeArchived ? resp : resp.filter((project: any) => !project.archived)
            return projects
        }),
        tap(projects => {
            console.log(`====>>>> number of projects read from group ${gitLabUrl}`, projects.length)
        }),
        concatMap(projects => from(projects)),
    )
}

