import {  concatMap, map, tap } from "rxjs"
import { runPagedCommand } from "./paged-command"
import { toCsv } from "@enrico.piccinin/csv-tools"
import { writeFileObs } from "observable-fs"
import path from "path"

export function getUsers$(gitLabUrl: string, token: string) {
    console.log(`====>>>> reading all users`)
    const command = `https://${gitLabUrl}/api/v4/users?per_page=100`
    return runPagedCommand(command, token).pipe(
        tap(users => {
            console.log(`====>>>> number of users read from GitLab: `, users.length)
        }),
    )
}

// writeUsersToExcel$ is a function that reads all users from GitLab and writes them to a csv file.
export function writeUsersToCsv$(gitLabUrl: string, token: string, outDir: string) {
    return getUsers$(gitLabUrl, token).pipe(
        map(users => {
            return toCsv(users)
        }),
        concatMap(csvRecs => {
            const csvFilePath = path.join(outDir, 'gilab-users.csv')
            return writeFileObs(csvFilePath, csvRecs)
        }),
        tap((file) => {
            console.log(`====>>>> users written to file: ${file}`)
        })
    )
}