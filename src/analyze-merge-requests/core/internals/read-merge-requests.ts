import axios from "axios";
import { EMPTY, expand, from, last, map } from "rxjs";

import { MergeRequest, newMergeRequestCompact } from "./merge-request.model";
import { runAnalysis } from "./analyze-merge-requests";

export function readMergeRequestsForGroup(gitLabUrl: string, token: string, groupId: string) {
    const query = nextListMergeRequestsCommand(gitLabUrl, token, groupId, 1)
    const mergeRequests: MergeRequest[] = []

    let totPages: any

    return from(query).pipe(
        map(resp => {
            const mergeRequestsPaged = resp.data
            mergeRequests.push(...mergeRequestsPaged)
            totPages = resp.headers['x-total-pages']
            console.log(`>>>>> read page ${1} of ${totPages} (total pages) - Merge requests read: ${mergeRequests.length}`)
            const _nextPage = nextPage(parseInt(totPages))
            return { mergeRequests, _nextPage }
        }),
        expand(({ mergeRequests, _nextPage }) => {
            const page = _nextPage()
            if (page === -1) {
                console.log(`>>>>> Reading of Merge Request completed`)
                return EMPTY
            }
            console.log(`>>>>> read page ${page} of ${totPages} (total pages) - Merge requests read: ${mergeRequests.length}`)
            return from(nextListMergeRequestsCommand(gitLabUrl, token, groupId, page)).pipe(
                map(resp => {
                    const mergeRequestsPaged = resp.data
                    mergeRequests.push(...mergeRequestsPaged)
                    return { mergeRequests, _nextPage }
                })
            )
        }),
        last(),
        map(({ mergeRequests }) => mergeRequests),
    )
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

function nextListMergeRequestsCommand(gitLabUrl: string, token: string, groupId: string, page: number) {
    const command = `https://${gitLabUrl}/api/v4/groups/${groupId}/merge_requests?state=all&per_page=100&page=${page}`
    return axios.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })
}

export function nextPage(totPages: number) {
    let page = 1
    return () => {
        if (page === totPages) {
            return -1
        }
        page++
        return page
    }
}