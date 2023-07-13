"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newRepoCompact = exports.cloneRepo = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../execute-command/execute-command");
const commit_functions_1 = require("./commit.functions");
// cloneRepo clones a repo from a given url to a given path and returns the path of the cloned repo
function cloneRepo(url, repoPath, repoName) {
    if (!url)
        throw new Error(`url is mandatory`);
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const command = `git clone ${url} ${repoPath}`;
    return (0, execute_command_1.executeCommandObs)(`Clone ${repoName}`, command).pipe((0, rxjs_1.tap)(() => `${repoName} cloned`), (0, rxjs_1.map)(() => repoPath), (0, rxjs_1.catchError)(() => {
        return (0, rxjs_1.of)(`Error: "${repoName}" while executing command "${command}"`);
    }));
}
exports.cloneRepo = cloneRepo;
// newRepoCompact returns an Observable that notifies a new RepoCompact filled with its commits sorted by date ascending
function newRepoCompact(repoPath) {
    return (0, commit_functions_1.fetchCommits)(repoPath).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((commits) => {
        const commitsSorted = commits.sort((a, b) => a.date.getTime() - b.date.getTime());
        const _commitsByMonth = (0, commit_functions_1.commitsByMonth)(commitsSorted);
        const repo = { path: repoPath, commits: commitsSorted, commitsByMonth: _commitsByMonth };
        return repo;
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: while reading the commits of repo "${repoPath}" - error:\n ${JSON.stringify(err, null, 2)}`);
        return rxjs_1.NEVER;
    }));
}
exports.newRepoCompact = newRepoCompact;
//# sourceMappingURL=repo.functions.js.map