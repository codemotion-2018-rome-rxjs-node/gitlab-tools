import { catchError, map, of } from 'rxjs';

import { executeCommandObs } from '../execute-command/execute-command';

export function cloneRepo(url: string, repoPath: string, repoName: string) {
    if (!url) throw new Error(`url is mandatory`);
    if (!repoPath) throw new Error(`Path is mandatory`);

    const command = `git clone ${url} ${repoPath}`;

    return executeCommandObs(`Clone ${repoName}`, command).pipe(
        map(() => `${repoName} cloned`),
        catchError(() => {
            return of(`Error: "${repoName}" while executing command "${command}"`)
        })
    );
}
