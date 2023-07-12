import axios from "axios"
import { from, map } from "rxjs"
import { GroupCompact } from "./group.model"


export function readGroup(gitLabUrl: string, token: string, groupId: string) {
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