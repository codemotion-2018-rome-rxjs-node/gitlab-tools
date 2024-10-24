import axios from "axios"
import { from, map, expand, EMPTY, last } from "rxjs"

export function runPagedCommand(command: string, token: string, itemType: string = 'items') {
    const items: any[] = []
    let totPages: string
    const firstPagedCall = firstCall(command, token)
    return from(firstPagedCall).pipe(
        map(resp => {
            const itemsPaged = resp.data
            items.push(...itemsPaged)
            // Different APIs use different ways to signal the end of pagination.
            // * For instance, the "users" API returns the 'x-total-pages' header in the response.
            // * The "commits" API returns the 'x-next-page' header in the response to each call.
            totPages = resp.headers['x-total-pages']
            const msg = totPages ? ` of ${totPages} (total pages)` : ''
            console.log(`>>>>> read page ${1}${msg} - ${itemType} read: ${items.length}`)
            const _nextPage = nextPage(parseInt(totPages))
            return { items, _nextPage, resp }
        }),
        expand(({ items, _nextPage, resp }) => {
            // Different APIs use different ways to signal the end of pagination.
            // * For instance, the "users" API returns the 'x-total-pages' header in the response.
            // * The "commits" API returns the 'x-next-page' header in the response to each call.
            const x_next_page = resp.headers['x-next-page']
            const page = _nextPage(x_next_page)
            if (page === -1) {
                console.log(`>>>>> Reading of items completed`)
                return EMPTY
            }
            return from(nextCall(command, token, page)).pipe(
                map(resp => {
                    const itemsPaged = resp.data
                    items.push(...itemsPaged)
                    const msg = totPages ? ` of ${totPages} (total pages)` : ''
                    console.log(`>>>>> read page ${page}${msg} - ${itemType} read: ${items.length}`)
                    return { items, _nextPage, resp }
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

/**
 * Creates a function to handle pagination.
 * Pagination can end in two ways:
 * 1. When the current page is equal to the total number of pages available.
 * 2. When the `x_next_page` parameter is not provided.
 * 
 * Different APIs use different ways to signal the end of pagination.
 * For instance, the "users" API returns the 'x-total-pages' header in the response.
 * The "commits" API returns the 'x-next-page' header in the response to each call.
 * 
 * @param {number} totPages - The total number of pages available.
 * @returns {function} - A function that takes an optional string parameter `x_next_page`.
 *                       If `x_next_page` is provided, it returns the parsed integer value of it.
 *                       If `page` equals `totPages` or `x_next_page` is not provided, it returns -1.
 *                       Otherwise, it increments the page and returns the new page number.
 */
export function nextPage(totPages: number) {
    let page = 1
    return (x_next_page?: string) => {
        if (page === totPages || !x_next_page) {
            return -1
        }
        if (x_next_page) {
            return parseInt(x_next_page)
        }
        page++
        return page
    }
}