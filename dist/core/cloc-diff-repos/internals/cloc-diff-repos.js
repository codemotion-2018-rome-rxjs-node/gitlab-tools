"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMonthlyClocDiffsOnRepos = void 0;
const path_1 = __importDefault(require("path"));
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const config_1 = require("../../../internals/config");
const repo_cloc_diff_functions_1 = require("../../../internals/git-functions/repo-cloc-diff.functions");
const repo_functions_1 = require("../../../internals/git-functions/repo.functions");
const repos_in_folder_1 = require("../../../internals/repos-functions/repos-in-folder");
// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
function calculateMonthlyClocDiffsOnRepos(folderPath, outdir, languages, concurrency = config_1.CONFIG.CONCURRENCY) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repos_in_folder_1.reposInFolderObs)(folderPath).pipe((0, rxjs_1.concatMap)((repos) => {
        const reposCommits = (0, repo_functions_1.groupRepoCommitsByMonth)(repos);
        const reposCommitsDict = (0, repo_functions_1.repoCommitsByMonthRecordsDict)(reposCommits);
        const repoMonthlyCommitPairs = (0, repo_cloc_diff_functions_1.reposCommitsPairsDiff)(reposCommitsDict);
        return (0, rxjs_1.from)(repoMonthlyCommitPairs);
    }), (0, rxjs_1.mergeMap)((repoMonthlyClocDiffs) => {
        return (0, repo_cloc_diff_functions_1.calculateMonthlyClocGitDiffs)(repoMonthlyClocDiffs, languages);
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc-diff.json`);
        return writeClocDiffJson(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }));
}
exports.calculateMonthlyClocDiffsOnRepos = calculateMonthlyClocDiffsOnRepos;
const writeClocDiffJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
//# sourceMappingURL=cloc-diff-repos.js.map