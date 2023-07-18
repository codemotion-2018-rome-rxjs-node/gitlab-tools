import path from "path"

import { writeFileObs } from "observable-fs"

import { concatMap, from, map, mergeMap, tap, toArray } from "rxjs"
import { CONFIG } from "../../../internals/config"
import { reposCommitsPairsDiff, calculateMonthlyClocGitDiffs } from "../../../internals/git-functions/repo-cloc-diff.functions"
import { groupRepoCommitsByMonth, repoCommitsByMonthRecordsDict } from "../../../internals/git-functions/repo.functions"
import { reposInFolderObs } from "../../../internals/git-functions/repo.functions"
import { RepoClocDiffStats } from "../../../internals/cloc-functions/cloc-diff.model"
import { toCsv } from "@enrico.piccinin/csv-tools"

// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
export function calculateMonthlyClocDiffsOnRepos(
    folderPath: string, outdir: string, languages: string[], fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = CONFIG.CONCURRENCY
) {
    const folderName = path.basename(folderPath);
    return reposInFolderObs(folderPath, fromDate, toDate).pipe(
        concatMap((repos) => {
            const reposCommits = groupRepoCommitsByMonth(repos)
            const reposCommitsDict = repoCommitsByMonthRecordsDict(reposCommits)
            const repoMonthlyCommitPairs = reposCommitsPairsDiff(reposCommitsDict)
            return from(repoMonthlyCommitPairs)
        }),
        mergeMap((repoMonthlyClocDiffs) => {
            return calculateMonthlyClocGitDiffs(repoMonthlyClocDiffs, languages)
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
    )
}

const writeClocDiffJson = (stats: RepoClocDiffStats[], outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

const writeClocCsv = (stats: RepoClocDiffStats[], outFile: string) => {
    return writeFileObs(outFile, statsToCsv(stats))
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}

function statsToCsv(reposStats: RepoClocDiffStats[]) {
    const csvRecs = reposStats.map(stats => flattenClocDiffStatsDict(stats)).flat();
    return toCsv(csvRecs);
}

export function flattenClocDiffStatsDict(stats: RepoClocDiffStats) {
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
        let sameFlat: clocDiffRec[] = []
        if (clocDiffStat.same) {
            sameFlat = Object.entries(clocDiffStat.same).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return { ...base, diffType: 'same', language, stat, value }
                }).flat()
            }).flat()
        } else {
            console.warn(`!!!!!!!!! No same stats for ${repoPath} in ${clocDiffStat.yearMonth} 
            with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`)
        }
        let addedFlat: clocDiffRec[] = []
        if (clocDiffStat.added) {
            addedFlat = Object.entries(clocDiffStat.added).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return { ...base, diffType: 'added', language, stat, value }
                }).flat()
            }).flat()
        } else {
            console.warn(`!!!!!!!!! No added stats for ${repoPath} in ${clocDiffStat.yearMonth}
            with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`)
        }
        let removedFlat: clocDiffRec[] = []
        if (clocDiffStat.removed) {
            removedFlat = Object.entries(clocDiffStat.removed).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return { ...base, diffType: 'removed', language, stat, value }
                }).flat()
            }).flat()
        } else {
            console.warn(`!!!!!!!!! No removed stats for ${repoPath} in ${clocDiffStat.yearMonth}
        with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`)
        }
        let modifiedFlat: clocDiffRec[] = []
        if (clocDiffStat.modified) {
            modifiedFlat = Object.entries(clocDiffStat.modified).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return { ...base, diffType: 'modified', language, stat, value }
                }).flat()
            }).flat()
        } else {
            console.warn(`!!!!!!!!! No modified stats for ${repoPath} in ${clocDiffStat.yearMonth}
        with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`)
        }
        return [...sameFlat, ...addedFlat, ...removedFlat, ...modifiedFlat]
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
    lastCommitInMonth: string | undefined;
    previousMonthCommit: string | undefined;
}