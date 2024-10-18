import axios from "axios"
import { from, map } from "rxjs"

export function getTags(gitLabUrl: string, token: string, projectId: string) {
    const command = `https://${gitLabUrl}/api/v4/projects/${projectId}/repository/tags`
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

