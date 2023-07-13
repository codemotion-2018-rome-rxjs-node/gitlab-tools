import { concatMap, from, map, mergeMap, tap, toArray } from "rxjs";

import { reposInFolder } from "../../../internals/repos-functions/repos-in-folder";
import { groupRepoCommitsByMonth, newRepoCompact, repoCommitsByMonthRecords } from "../../../internals/git-functions/repo.functions";
import path from "path";
import { writeFileObs } from "observable-fs";
import { toCsv } from "@enrico.piccinin/csv-tools";

// readReposCommits reeads all the repos contained in a directory and returns an observable of an array of RepoCompact
export function readReposCommits(folderPath: string, outdir: string, concurrency = 1) {
    const repoPaths = reposInFolder(folderPath);
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return newRepoCompact(repoPath)
        }, concurrency),
        toArray(),
        concatMap((repos) => {
            const folderName = path.basename(folderPath);
            const outFile = path.join(outdir, `${folderName}.json`);

            return writeFileObs(outFile, [
                // add a replacer function since JSON.stringify does not support Set
                // https://stackoverflow.com/a/46491780/5699993
                JSON.stringify(repos,
                    (_key, value) => (value instanceof Set ? [...value] : value),
                    2)
            ])
                .pipe(
                    tap({
                        next: () => console.log(`====>>>> Repos info written in file: ${outFile}`),
                    }),
                    map(() => repos)
                );
        }),
        concatMap((repos) => {
            const repoCommitsByMonth = groupRepoCommitsByMonth(repos)

            const folderName = path.basename(folderPath);
            const outFile = path.join(outdir, `${folderName}-repos-commits-by-month.json`);

            return writeFileObs(outFile, [
                // add a replacer function since JSON.stringify does not support Set
                // https://stackoverflow.com/a/46491780/5699993
                JSON.stringify(repoCommitsByMonth, null, 2)])
                .pipe(
                    tap({
                        next: () => console.log(`====>>>> Repos commits by month info written in file: ${outFile}`),
                    }),
                    map(() => repoCommitsByMonth)
                );
        }),
        concatMap((repoCommitsByMonth) => {
            const repoCommitsByMonthRecs = repoCommitsByMonthRecords(repoCommitsByMonth)
            const repoCommitsByMonthCsvs = toCsv(repoCommitsByMonthRecs)

            const folderName = path.basename(folderPath);
            const outFile = path.join(outdir, `${folderName}-repos-commits-by-month.csv`);

            return writeFileObs(outFile, repoCommitsByMonthCsvs).pipe(
                tap({
                    next: () => console.log(`====>>>> Repos commits by month csv records written in file: ${outFile}`),
                })
            );
        }),
    )
}