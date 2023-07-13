import { concatMap, from, map, mergeMap, toArray } from "rxjs";

import { reposInFolder } from "../repos-functions/repos-in-folder";
import { newRepoCompact } from "../git-functions/repo.functions";
import path from "path";
import { writeFileObs } from "observable-fs";

// readReposCommits reeads all the repos contained in a directory and returns an observable of an array of RepoCompact
export function readReposCommits(folderPath: string, outdir: string) {
    const repoPaths = reposInFolder(folderPath);
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return newRepoCompact(repoPath)
        }),
        toArray(),
        concatMap((repos) => {
            const folderName = path.basename(folderPath);
            const outFile = path.join(outdir, `${folderName}.json`);
            // add a replacer function since JSON.stringify does not support Set
            // https://stackoverflow.com/a/46491780/5699993
            return writeFileObs(outFile, [JSON.stringify(repos,
                (_key, value) => (value instanceof Set ? [...value] : value),
                2)]).pipe(
                    map(() => ({ repos, outFile }))
                );
        })
    )
}