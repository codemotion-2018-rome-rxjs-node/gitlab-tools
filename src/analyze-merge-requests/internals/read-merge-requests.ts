
import { map } from "rxjs";

import { MergeRequest, newMergeRequestCompact } from "./merge-request.model";
import { runAnalysis } from "./analyze-merge-requests";
import { runPagedCommand } from "../../gitlab-functions/paged-command";

export function readMergeRequestsForGroup(gitLabUrl: string, token: string, groupId: string) {
    const command = listMergeRequestsCommand(gitLabUrl, groupId)

    return runPagedCommand(command, token)
}

export function toMergeRequestCompact(mergeRequests: MergeRequest[]) {
    const mergeRequestsCompact = mergeRequests.map(mergeRequest => {
        return newMergeRequestCompact(mergeRequest)
    })
    return mergeRequestsCompact
}

export function runMergeRequestAnalysis(gitLabUrl: string, token: string, groupId: string) {
    return readMergeRequestsForGroup(gitLabUrl, token, groupId).pipe(
        map((mergeRequests) => toMergeRequestCompact(mergeRequests)),
        map(mergeRequestsCompact => {
            return runAnalysis(mergeRequestsCompact)
        })
    )
}

function listMergeRequestsCommand(gitLabUrl: string, groupId: string) {
    return `https://${gitLabUrl}/api/v4/groups/${groupId}/merge_requests?state=all&per_page=100`
}
