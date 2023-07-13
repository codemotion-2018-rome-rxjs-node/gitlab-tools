import { NEVER, catchError, map, of, tap, toArray } from 'rxjs';

import { executeCommandObs } from '../execute-command/execute-command';
import { commitsByMonth, fetchCommits } from './commit.functions';
import { RepoCompact } from './repo.model';

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
