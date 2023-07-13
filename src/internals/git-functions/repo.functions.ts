import { NEVER, catchError, map, of, tap, toArray } from 'rxjs';

import { executeCommandObs } from '../execute-command/execute-command';
import { commitsByMonth, fetchCommits } from './commit.functions';
import { RepoCompact } from './repo.model';
import { ReposWithCommitsByMonths } from './repo.model';

// cloneRepo clones a repo from a given url to a given path and returns the path of the cloned repo
export function cloneRepo(url: string, repoPath: string, repoName: string) {
    if (!url) throw new Error(`url is mandatory`);
    if (!repoPath) throw new Error(`Path is mandatory`);

    const command = `git clone ${url} ${repoPath}`;

    return executeCommandObs(`Clone ${repoName}`, command).pipe(
        tap(() => `${repoName} cloned`),
        map(() => repoPath),
        catchError(() => {
            return of(`Error: "${repoName}" while executing command "${command}"`)
        })
    );
}

// newRepoCompact returns an Observable that notifies a new RepoCompact filled with its commits sorted by date ascending
export function newRepoCompact(repoPath: string) {
    return fetchCommits(repoPath).pipe(
        toArray(),
        map((commits) => {
            const commitsSorted = commits.sort((a, b) => a.date.getTime() - b.date.getTime());
            const _commitsByMonth = commitsByMonth(commitsSorted)
            const repo: RepoCompact = { path: repoPath, commits: commitsSorted, commitsByMonth: _commitsByMonth }
            return repo
        }),
        catchError((err) => {
            console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`)
            return NEVER
        })
    );
}

// groupRepoCommitsByMonth retuns all the repos that have commits in a given month grouped by month
// #copilot - the entire method has been generated by copilot once I have specified the return type
export function groupRepoCommitsByMonth(repos: RepoCompact[]): ReposWithCommitsByMonths {
    const reposByMonthUnordered = repos.reduce((acc, repo) => {
        Object.keys(repo.commitsByMonth).forEach((yearMonth) => {
            if (!acc[yearMonth]) {
                acc[yearMonth] = []
            }
            acc[yearMonth].push({
                repoPath: repo.path,
                commits: repo.commitsByMonth[yearMonth].commits,
                authors: Array.from(repo.commitsByMonth[yearMonth].authors)
            })
        })
        return acc
    }, {} as ReposWithCommitsByMonths)

    const reposByMonthOrdered = Object.keys(reposByMonthUnordered).sort().reduce(
        (obj, key) => {
            obj[key] = reposByMonthUnordered[key];
            return obj;
        }, {} as ReposWithCommitsByMonths);

    const [firstYearMonth, lastYearMonth] = getMinMax(Object.keys(reposByMonthOrdered))
    fillMissingMonths(reposByMonthOrdered, firstYearMonth, lastYearMonth, [])
    return reposByMonthOrdered
}

// fillMissingMonths fills the missing months in a given ReposWithCommitsByMonths object
// #copilot - the core of the method has been generated by copilot
export function fillMissingMonths(dict: { [yearMonth: string]: any }, firstYearMonth: string, lastYearMonth: string, value: any) {
    const firstYear = parseInt(firstYearMonth.split('-')[0])
    const firstMonth = parseInt(firstYearMonth.split('-')[1])
    const firstYearMonthAsNumber = yearMonthAsNumber(firstYear, firstMonth)

    const lastYear = parseInt(lastYearMonth.split('-')[0])
    const lastMonth = parseInt(lastYearMonth.split('-')[1])
    const lastYearMonthAsNumber = yearMonthAsNumber(lastYear, lastMonth)

    for (let year = firstYear; year <= lastYear; year++) {
        for (let month = 1; month <= 12; month++) {
            const yearMonth = `${year}-${month.toString().padStart(2, '0')}`
            if (!dict[yearMonth]) {
                if (yearMonthAsNumber(year, month) < firstYearMonthAsNumber) continue
                if (yearMonthAsNumber(year, month) > lastYearMonthAsNumber) continue
                dict[yearMonth] = value
            }
        }
    }
}

function getMinMax(arr: string[]) {
    if (!arr || arr.length === 0) {
        throw new Error(`arr must be not null and must have at least one element`);
    }
    var minV = arr[0];
    var maxV = arr[0];
    for (let a of arr) {
        if (a < minV) minV = a;
        if (a > maxV) maxV = a;
    }
    return [minV, maxV];
}

function yearMonthAsNumber(year: number, month: number) {
    return year * 100 + month
}

// repoCommitsByMonthRecords returns a dictionary where the repo paths are the keys and the values are the commits grouped by month
export function repoCommitsByMonthRecords(reposByMonths: ReposWithCommitsByMonths) {
    const records: { [repoPath: string]: { [yearMonth: string]: number } } = {}

    const allYearMonths = Object.keys(reposByMonths).reduce((acc, yearMonth) => {
        acc[yearMonth] = 0
        return acc
    }, {} as { [yearMonth: string]: number })

    const allReposPaths = Object.values(reposByMonths).reduce((acc, repos) => {
        repos.forEach((repo) => {
            if (!acc.includes(repo.repoPath)) {
                acc.push(repo.repoPath)
            }
        })
        return acc
    }, [] as string[])

    allReposPaths.forEach((repoPath) => {
        records[repoPath] = { ...allYearMonths }
    })

    Object.entries(reposByMonths).forEach(([yearMonth, repos]) => {
        repos.forEach((repo) => {
            const rec = records[repo.repoPath]
            rec[yearMonth] = repo.commits.length
        })
    })
    return Object.entries(records).map(([repoPath, commitsByMonth]) => {
        return { repoPath, ...commitsByMonth } as any
    })
}