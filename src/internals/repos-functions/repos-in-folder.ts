import * as fs from 'fs';
import path from 'path';
import { from, mergeMap, toArray } from 'rxjs';
import { newRepoCompact } from '../git-functions/repo.functions';

// reposInFolder returns the list of git repos paths in a given folder
export function reposInFolder(folderPath: string) {
    let gitRepos: string[] = [];
    const filesAndDirs = fs.readdirSync(folderPath)
    if (filesAndDirs.some(fileOrDir => fileOrDir === '.git')) {
        gitRepos.push(folderPath);
    }
    filesAndDirs.forEach(fileOrDir => {
        const absolutePath = path.join(folderPath, fileOrDir);
        if (fs.statSync(absolutePath).isDirectory()) {
            const subRepos = reposInFolder(absolutePath);
            gitRepos = gitRepos.concat(subRepos);
        }
    });
    return gitRepos
}

export function reposInFolderObs(folderPath: string, concurrency = 1) {
    const repoPaths = reposInFolder(folderPath);
    return from(repoPaths).pipe(
        mergeMap((repoPath) => {
            return newRepoCompact(repoPath)
        }, concurrency),
        toArray(),
    )
}