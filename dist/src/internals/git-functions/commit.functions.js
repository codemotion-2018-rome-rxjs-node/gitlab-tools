"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitsByMonth = exports.newCommitCompact = exports.fetchCommits = void 0;
const rxjs_1 = require("rxjs");
const execute_command_1 = require("../execute-command/execute-command");
// fetchCommit is a function that fetched all the commits from a git repo and returns the sha of each commit and its date
// #copilot comment - the following comment has been added by copilot
// It uses the git log command to fetch the commits
// It returns an observable of an array of strings
// Each string is a commit sha and date separated by a comma
// The observable is an error if the command fails
function fetchCommits(repoPath) {
    if (!repoPath)
        throw new Error(`Path is mandatory`);
    const command = `cd ${repoPath} && git log --pretty=format:"%H,%ad,%an"`;
    return (0, execute_command_1.executeCommandObs)(`Fetch commits`, command).pipe((0, rxjs_1.map)((commits) => commits.split('\n')), (0, rxjs_1.mergeMap)((commits) => commits), (0, rxjs_1.map)((commit) => {
        return newCommitCompact(commit);
    }), (0, rxjs_1.catchError)((err) => {
        console.error(`Error: "fetchCommits" while executing command "${command}" - error ${JSON.stringify(err, null, 2)}`);
        return rxjs_1.NEVER;
    }));
}
exports.fetchCommits = fetchCommits;
// newCommitCompact returns a new CommitCompact object with the given sha and date
function newCommitCompact(data) {
    const shaDateAuthor = data.split(',');
    const commit = {
        sha: shaDateAuthor[0],
        date: new Date(shaDateAuthor[1]),
        author: shaDateAuthor[2]
    };
    return commit;
}
exports.newCommitCompact = newCommitCompact;
// commitsByMonth returns an array of CommitCompact objects grouped by month
// #copilot - the entire method has been generated by copilot, the only thing I changes was the key where copilot put
// month first and year second, I changed it to year first and month second
// I also changed the format of the month to be 2 digits
function commitsByMonth(commits) {
    const commitsByMonth = commits.reduce((acc, commit) => {
        const month = ("0" + (commit.date.getMonth() + 1)).slice(-2);
        const year = commit.date.getFullYear();
        const key = `${year}-${month}`;
        if (!acc[key]) {
            acc[key] = {
                commits: [],
                authors: new Set()
            };
        }
        acc[key].commits.push(commit);
        acc[key].authors.add(commit.author);
        return acc;
    }, {});
    return commitsByMonth;
}
exports.commitsByMonth = commitsByMonth;
//# sourceMappingURL=commit.functions.js.map