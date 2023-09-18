import path from "path"

import { writeFileObs } from "observable-fs"

import { concatMap, from, map, mergeMap, tap, toArray } from "rxjs"
import { CONFIG } from "../../../internals/config"
import { reposCommitsPairsDiff, calculateMonthlyClocGitDiffs, calculateClocGitDiffs } from "../../../internals/git-functions/repo-cloc-diff.functions"
import { newRepoCompactWithCommitPairs, newReposWithCommitsByMonth, repoCommitsByMonthRecordsDict, reposCompactInFolderObs } from "../../../internals/git-functions/repo.functions"
import { reposCompactWithCommitsByMonthsInFolderObs } from "../../../internals/git-functions/repo.functions"
import { ClocDiffLanguageStats, ClocDiffStats, RepoMonthlyClocDiffStats } from "../../../internals/cloc-functions/cloc-diff.model"
import { toCsv } from "@enrico.piccinin/csv-tools"

export function calculateClocDiffsOnRepos(
    folderPath: string,
    outdir: string,
    languages: string[],
    fromDate = new Date(0),
    toDate = new Date(Date.now()),
    concurrency = CONFIG.CONCURRENCY,
    excludeRepoPaths: string[] = []
) {
    const startTime = new Date().getTime()
    const folderName = path.basename(folderPath);

    let pairsCompleted = 0
    let pairRemaining = 0

    return reposCompactInFolderObs(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe(
        concatMap((repo) => {
            const repoWithCommitPairs = newRepoCompactWithCommitPairs(repo)
            return from(repoWithCommitPairs.commitPairs)
        }),
        toArray(),
        concatMap((commitPairs) => {
            pairRemaining = commitPairs.length
            const sortedByYearMonth = commitPairs.sort((a, b) => {
                return a.yearMonth.localeCompare(b.yearMonth)
            })
            return from(sortedByYearMonth)
        }),
        mergeMap((commitPair) => {
            return calculateClocGitDiffs(commitPair, languages).pipe(
                tap(() => {
                    console.log(`====>>>> commit pairs completed: ${pairsCompleted++} `)
                    console.log(`====>>>> commit pairs remaining: ${pairRemaining--} `)
                })
            )
        }, concurrency),
        toArray(),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.json`);
            return writeClocDiffJson(stats, outFile).pipe(
                map(() => stats)
            )
        }),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-cloc-diff.csv`);
            return writeClocCsv(stats, outFile).pipe(
                map(() => stats)
            )
        }),
        tap(() => {
            const endTime = new Date().getTime()
            console.log(`====>>>> Total time to calculate cloc diffs: ${(endTime - startTime) / 1000} seconds`)
        })
    )
}

// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
export function calculateMonthlyClocDiffsOnRepos(
    folderPath: string, outdir: string, languages: string[], fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = CONFIG.CONCURRENCY
) {
    const folderName = path.basename(folderPath);
    return reposCompactWithCommitsByMonthsInFolderObs(folderPath, fromDate, toDate).pipe(
        toArray(),
        concatMap((repos) => {
            const reposCommits = newReposWithCommitsByMonth(repos)
            const reposCommitsDict = repoCommitsByMonthRecordsDict(reposCommits)
            const repoMonthlyCommitPairs = reposCommitsPairsDiff(reposCommitsDict)
            return from(repoMonthlyCommitPairs)
        }),
        mergeMap((repoMonthlyClocDiffs) => {
            return calculateMonthlyClocGitDiffs(repoMonthlyClocDiffs, languages)
        }, concurrency),
        toArray(),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-monthly-cloc-diff.json`);
            return writeMonthlyClocDiffJson(stats, outFile).pipe(
                map(() => stats)
            )
        }),
        concatMap((stats) => {
            const outFile = path.join(outdir, `${folderName}-monthly-cloc-diff.csv`);
            return writeMonthlyClocCsv(stats, outFile).pipe(
                map(() => stats)
            )
        }),
    )
}

const writeClocDiffJson = (stats: {
    yearMonth: string;
    clocDiff: ClocDiffStats;
}[], outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

const writeClocCsv = (stats: {
    repoPath: string,
    yearMonth: string;
    leastRecentCommitDate: string;
    clocDiff: ClocDiffStats;
}[], outFile: string) => {
    return writeFileObs(outFile, statsToCsv(stats))
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

function statsToCsv(reposStats: {
    repoPath: string,
    yearMonth: string;
    leastRecentCommitDate: string;
    clocDiff: ClocDiffStats;
}[]) {
    const csvRecs = reposStats
        .filter(stat => !stat.clocDiff.error)
        .map(stat => flattenClocDiffStat(stat)).flat();
    return toCsv(csvRecs);
}

function flattenClocDiffStat(stat: {
    repoPath: string,
    yearMonth: string;
    leastRecentCommitDate: string;
    clocDiff: ClocDiffStats;
}) {
    const repoPath = stat.repoPath
    const yearMonth = stat.yearMonth
    const clocDiffStat = stat.clocDiff
    const base = {
        repoPath,
        yearMonth,
        leastRecentCommit: clocDiffStat.leastRecentCommitSha,
        mostRecentCommit: clocDiffStat.mostRecentCommitSha,
    }
    return clocDiffStatToCsvWithBase(
        clocDiffStat.diffs,
        base,
        repoPath,
        clocDiffStat.leastRecentCommitSha!,
        clocDiffStat.mostRecentCommitSha!
    )
}

const writeMonthlyClocDiffJson = (stats: RepoMonthlyClocDiffStats[], outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

const writeMonthlyClocCsv = (stats: RepoMonthlyClocDiffStats[], outFile: string) => {
    return writeFileObs(outFile, monthlyStatsToCsv(stats))
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

function monthlyStatsToCsv(reposStats: RepoMonthlyClocDiffStats[]) {
    const csvRecs = reposStats.map(stats => flattenMonthlyClocDiffStatsDict(stats)).flat();
    return toCsv(csvRecs);
}

export function flattenMonthlyClocDiffStatsDict(stats: RepoMonthlyClocDiffStats) {
    const repoPath = stats.repoPath
    const clocDiffStats = stats.clocDiffStats
    const clocDiffStatsList = Object.keys(clocDiffStats).map((yearMonth) => {
        return { yearMonth, ...clocDiffStats[yearMonth] }
    })
    const clocDiffStatsListFlat = clocDiffStatsList.map((clocDiffStat) => {
        const diffTypes = clocDiffStat.diffs;
        const clocDiffStatFlat = { ...clocDiffStat, ...diffTypes }
        delete (clocDiffStatFlat as any).diffs
        return clocDiffStatFlat
    })
    const clocDiffTypeStatsListFlat = clocDiffStatsListFlat.map((clocDiffStat) => {
        const base = {
            repoPath,
            yearMonth: clocDiffStat.yearMonth,
            lastCommitInMonth: clocDiffStat.mostRecentCommitSha,
            previousMonthCommit: clocDiffStat.leastRecentCommitSha
        }
        return clocDiffStatToCsvWithBase(
            clocDiffStat,
            base,
            repoPath,
            clocDiffStat.leastRecentCommitSha!,
            clocDiffStat.mostRecentCommitSha!
        )
    })

    return clocDiffTypeStatsListFlat.flat()
}

type clocDiffRec = {
    diffType: string;
    language: string;
    stat: string;
    value: any;
    repoPath: string;
    yearMonth: string;
    leastRecentCommit: string | undefined;
    moreRecentCommit: string | undefined;
}

function clocDiffStatToCsvWithBase(clocDiffStat: {
    same: ClocDiffLanguageStats;
    modified: ClocDiffLanguageStats;
    added: ClocDiffLanguageStats;
    removed: ClocDiffLanguageStats;
}, base: any,
    repoPath: string,
    leastRecentCommit: string,
    mostRecentCommit: string,) {

    let sameFlat: clocDiffRec[] = []
    if (!clocDiffStat) {
        console.warn('!!!!!!!!! No SAME stats for ${repoPath}')
    }
    if (clocDiffStat.same) {
        sameFlat = Object.entries(clocDiffStat.same).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return { ...base, diffType: 'same', language, stat, value }
            }).flat()
        }).flat()
    } else {
        console.warn(`!!!!!!!!! No SAME stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`)
    }
    let addedFlat: clocDiffRec[] = []
    if (clocDiffStat.added) {
        addedFlat = Object.entries(clocDiffStat.added).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return { ...base, diffType: 'added', language, stat, value }
            }).flat()
        }).flat()
    } else {
        console.warn(`!!!!!!!!! No ADDED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`)
    }
    let removedFlat: clocDiffRec[] = []
    if (clocDiffStat.removed) {
        removedFlat = Object.entries(clocDiffStat.removed).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return { ...base, diffType: 'removed', language, stat, value }
            }).flat()
        }).flat()
    } else {
        console.warn(`!!!!!!!!! No REMOVED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`)
    }
    let modifiedFlat: clocDiffRec[] = []
    if (clocDiffStat.modified) {
        modifiedFlat = Object.entries(clocDiffStat.modified).map(([language, clocStats]) => {
            return Object.entries(clocStats).map(([stat, value]) => {
                return { ...base, diffType: 'modified', language, stat, value }
            }).flat()
        }).flat()
    } else {
        console.warn(`!!!!!!!!! No MODIFIED stats for ${repoPath}
            with commits ${leastRecentCommit} and ${mostRecentCommit}`)
    }
    const csvRecords = [...sameFlat, ...addedFlat, ...removedFlat, ...modifiedFlat]
    return csvRecords
}