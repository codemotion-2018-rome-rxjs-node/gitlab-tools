import path from "path"

import { writeFileObs } from "observable-fs"

import { concatMap, from, map, mergeMap, tap, toArray } from "rxjs"
import { CONFIG } from "../../../internals/config"
import { reposCommitsPairsDiff, calculateMonthlyClocGitDiffs } from "../../../internals/git-functions/repo-cloc-diff.functions"
import { groupRepoCommitsByMonth, repoCommitsByMonthRecordsDict } from "../../../internals/git-functions/repo.functions"
import { reposInFolderObs } from "../../../internals/git-functions/repo.functions"
import { ClocDiffStats } from "../../../internals/cloc-functions/cloc-diff.model"

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
    )
}

const writeClocDiffJson = (stats: {
    repoPath: string;
    clocDiffStats: {
        [yearMonth: string]: ClocDiffStats;
    };
}[], outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(stats, null, 2)])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
            }),
            map(() => stats)
        );
}