
import { MergeRequest, newMergeRequestCompact } from "./merge-request.model";
import { runPagedCommand } from "./paged-command";

export function readMergeRequestsForGroup(gitLabUrl: string, token: string, groupId: string) {
    const command = listMergeRequestsCommand(gitLabUrl, groupId)

    return runPagedCommand(command, token, 'merge_requests')
}

export function toMergeRequestCompact(mergeRequests: MergeRequest[]) {
    const mergeRequestsCompact = mergeRequests.map(mergeRequest => {
        return newMergeRequestCompact(mergeRequest)
    })
    return mergeRequestsCompact
}

function listMergeRequestsCommand(gitLabUrl: string, groupId: string) {
    return `https://${gitLabUrl}/api/v4/groups/${groupId}/merge_requests?state=all&per_page=100`
}
