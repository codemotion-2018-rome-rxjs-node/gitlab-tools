import path from "path";
import { concatMap, from, map, mergeMap, tap, toArray } from "rxjs";

import { writeFileObs } from "observable-fs";
import { toCsv } from "@enrico.piccinin/csv-tools";

import { reposInFolder } from "../../../internals/repos-functions/repos-in-folder";
import { groupRepoCommitsByMonth, newRepoCompact, repoCommitsByMonthRecords } from "../../../internals/git-functions/repo.functions";

import { RepoCompact, ReposWithCommitsByMonths } from "../../../internals/git-functions/repo.model";

// readReposCommits reeads all the repos contained in a directory and returns an observable of an array of RepoCompact
export function readReposCommits(folderPath: string, outdir: string, concurrency = 1) {
    const folderName = path.basename(folderPath);

    return reposInFolderObs(folderPath, concurrency).pipe(
        concatMap((repos) => {
            const outFile = path.join(outdir, `${folderName}.json`);
            return writeReposJson(repos, outFile)
        }),
        concatMap((repos) => {
            const outFile = path.join(outdir, `${folderName}-repos-commits-by-month.json`);
            const repoCommitsByMonth = groupRepoCommitsByMonth(repos)
            return writeReposCommitsByMonthJson(repoCommitsByMonth, outFile);
        }),
        concatMap((repoCommitsByMonth) => {
            const outFile = path.join(outdir, `${folderName}-repos-commits-by-month.csv`);
            return writeReposCommitsByMonthCsv(repoCommitsByMonth, outFile);
        }),
    )
}

function reposInFolderObs(folderPath: string, concurrency = 1) {
    const repoPaths = reposInFolder(folderPath);
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return newRepoCompact(repoPath)
        }, concurrency),
        toArray(),
    )
}

const writeReposJson = (repos: RepoCompact[], outFile: string) => {
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
}

const writeReposCommitsByMonthJson = (repoCommitsByMonth: ReposWithCommitsByMonths, outFile: string) => {
    return writeFileObs(outFile, [JSON.stringify(repoCommitsByMonth, null, 2)])
        .pipe(
            tap({
                next: () => console.log(`====>>>> Repos commits by month info written in file: ${outFile}`),
            }),
            map(() => repoCommitsByMonth)
        );
}

const writeReposCommitsByMonthCsv = (repoCommitsByMonth: ReposWithCommitsByMonths, outFile: string) => {
    const repoCommitsByMonthRecs = repoCommitsByMonthRecords(repoCommitsByMonth)
    const repoCommitsByMonthCsvs = toCsv(repoCommitsByMonthRecs)

    return writeFileObs(outFile, repoCommitsByMonthCsvs).pipe(
        tap({
            next: () => console.log(`====>>>> Repos commits by month csv records written in file: ${outFile}`),
        })
    );
}