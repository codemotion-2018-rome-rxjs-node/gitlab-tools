import axios from "axios"
import { from, map, expand, EMPTY, last } from "rxjs"

export function runPagedCommand(command: string, token: string) {
    const items: any[] = []
    let totPages: string
    const firstPagedCall = firstCall(command, token)
    return from(firstPagedCall).pipe(
        map(resp => {
            const itemsPaged = resp.data
            items.push(...itemsPaged)
            totPages = resp.headers['x-total-pages']
            console.log(`>>>>> read page ${1} of ${totPages} (total pages) - Items read: ${items.length}`)
            const _nextPage = nextPage(parseInt(totPages))
            return { items, _nextPage }
        }),
        expand(({ items, _nextPage }) => {
            const page = _nextPage()
            if (page === -1) {
                console.log(`>>>>> Reading of Merge Request completed`)
                return EMPTY
            }
            return from(nextCall(command, token, page)).pipe(
                map(resp => {
                    const itemsPaged = resp.data
                    items.push(...itemsPaged)
                    console.log(`>>>>> read page ${page} of ${totPages} (total pages) - Items read: ${items.length}`)
                    return { items, _nextPage }
                })
            )
        }),
        last(),
        map(({ items }) => items),
    )
}

function firstCall(command: string, token: string) {
    const firstPageCommand = pagedCommand(command, 1)
    return remoteCall(firstPageCommand, token)
}

function nextCall(command: string, token: string, page: number) {
    const nextPageCommand = pagedCommand(command, page)
    return remoteCall(nextPageCommand, token)
}

function remoteCall(command: string, token: string) {
    return axios.get(command, {
        headers: {
            "PRIVATE-TOKEN": token
        }
    })
}

function pagedCommand(command: string, page: number) {
    return `${command}&page=${page}`
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