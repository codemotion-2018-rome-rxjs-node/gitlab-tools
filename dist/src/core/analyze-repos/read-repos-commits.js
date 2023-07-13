"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readReposCommits = void 0;
const rxjs_1 = require("rxjs");
const repos_in_folder_1 = require("../../internals/repos-functions/repos-in-folder");
const repo_functions_1 = require("../../internals/git-functions/repo.functions");
const path_1 = __importDefault(require("path"));
const observable_fs_1 = require("observable-fs");
// readReposCommits reeads all the repos contained in a directory and returns an observable of an array of RepoCompact
function readReposCommits(folderPath, outdir) {
    const repoPaths = (0, repos_in_folder_1.reposInFolder)(folderPath);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)((repoPath) => {
        return (0, repo_functions_1.newRepoCompact)(repoPath);
    }), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((repos) => {
        const folderName = path_1.default.basename(folderPath);
        const outFile = path_1.default.join(outdir, `${folderName}.json`);
        return (0, observable_fs_1.writeFileObs)(outFile, [
            // add a replacer function since JSON.stringify does not support Set
            // https://stackoverflow.com/a/46491780/5699993
            JSON.stringify(repos, (_key, value) => (value instanceof Set ? [...value] : value), 2)
        ])
            .pipe((0, rxjs_1.tap)({
            next: () => console.log(`====>>>> Repos info written in file: ${outFile}`),
        }), (0, rxjs_1.map)(() => repos));
    }), (0, rxjs_1.concatMap)((repos) => {
        const repoCommitsByMonth = (0, repo_functions_1.groupRepoCommitsByMonth)(repos);
        const folderName = path_1.default.basename(folderPath);
        const outFile = path_1.default.join(outdir, `${folderName}-repos-commits-by-month.json`);
        return (0, observable_fs_1.writeFileObs)(outFile, [
            // add a replacer function since JSON.stringify does not support Set
            // https://stackoverflow.com/a/46491780/5699993
            JSON.stringify(repoCommitsByMonth, null, 2)
        ])
            .pipe((0, rxjs_1.tap)({
            next: () => console.log(`====>>>> Repos commits by month info written in file: ${outFile}`),
        }), (0, rxjs_1.map)(() => repos));
    }));
}
exports.readReposCommits = readReposCommits;
//# sourceMappingURL=read-repos-commits.js.map