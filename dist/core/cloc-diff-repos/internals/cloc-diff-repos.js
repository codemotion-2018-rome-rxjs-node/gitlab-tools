"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenClocDiffStatsDict = exports.calculateMonthlyClocDiffsOnRepos = void 0;
const path_1 = __importDefault(require("path"));
const observable_fs_1 = require("observable-fs");
const rxjs_1 = require("rxjs");
const config_1 = require("../../../internals/config");
const repo_cloc_diff_functions_1 = require("../../../internals/git-functions/repo-cloc-diff.functions");
const repo_functions_1 = require("../../../internals/git-functions/repo.functions");
const repo_functions_2 = require("../../../internals/git-functions/repo.functions");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
function calculateMonthlyClocDiffsOnRepos(folderPath, outdir, languages, fromDate = new Date(0), toDate = new Date(Date.now()), concurrency = config_1.CONFIG.CONCURRENCY) {
    const folderName = path_1.default.basename(folderPath);
    return (0, repo_functions_2.reposInFolderObs)(folderPath, fromDate, toDate).pipe((0, rxjs_1.concatMap)((repos) => {
        const reposCommits = (0, repo_functions_1.groupRepoCommitsByMonth)(repos);
        const reposCommitsDict = (0, repo_functions_1.repoCommitsByMonthRecordsDict)(reposCommits);
        const repoMonthlyCommitPairs = (0, repo_cloc_diff_functions_1.reposCommitsPairsDiff)(reposCommitsDict);
        return (0, rxjs_1.from)(repoMonthlyCommitPairs);
    }), (0, rxjs_1.mergeMap)((repoMonthlyClocDiffs) => {
        return (0, repo_cloc_diff_functions_1.calculateMonthlyClocGitDiffs)(repoMonthlyClocDiffs, languages);
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc-diff.json`);
        return writeClocDiffJson(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }), (0, rxjs_1.concatMap)((stats) => {
        const outFile = path_1.default.join(outdir, `${folderName}-cloc-diff.csv`);
        return writeClocCsv(stats, outFile).pipe((0, rxjs_1.map)(() => stats));
    }));
}
exports.calculateMonthlyClocDiffsOnRepos = calculateMonthlyClocDiffsOnRepos;
const writeClocDiffJson = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats JSON written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
const writeClocCsv = (stats, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, statsToCsv(stats))
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Cloc diff stats csv written in file: ${outFile}`),
    }), (0, rxjs_1.map)(() => stats));
};
function statsToCsv(reposStats) {
    const csvRecs = reposStats.map(stats => flattenClocDiffStatsDict(stats)).flat();
    return (0, csv_tools_1.toCsv)(csvRecs);
}
function flattenClocDiffStatsDict(stats) {
    const repoPath = stats.repoPath;
    const clocDiffStats = stats.clocDiffStats;
    const clocDiffStatsList = Object.keys(clocDiffStats).map((yearMonth) => {
        return Object.assign({ yearMonth }, clocDiffStats[yearMonth]);
    });
    const clocDiffStatsListFlat = clocDiffStatsList.map((clocDiffStat) => {
        const diffTypes = clocDiffStat.diffs;
        const clocDiffStatFlat = Object.assign(Object.assign({}, clocDiffStat), diffTypes);
        delete clocDiffStatFlat.diffs;
        return clocDiffStatFlat;
    });
    const clocDiffTypeStatsListFlat = clocDiffStatsListFlat.map((clocDiffStat) => {
        const base = {
            repoPath,
            yearMonth: clocDiffStat.yearMonth,
            lastCommitInMonth: clocDiffStat.mostRecentCommitSha,
            previousMonthCommit: clocDiffStat.leastRecentCommitSha
        };
        let sameFlat = [];
        if (clocDiffStat.same) {
            sameFlat = Object.entries(clocDiffStat.same).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return Object.assign(Object.assign({}, base), { diffType: 'same', language, stat, value });
                }).flat();
            }).flat();
        }
        else {
            console.warn(`!!!!!!!!! No same stats for ${repoPath} in ${clocDiffStat.yearMonth} 
            with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`);
        }
        let addedFlat = [];
        if (clocDiffStat.added) {
            addedFlat = Object.entries(clocDiffStat.added).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return Object.assign(Object.assign({}, base), { diffType: 'added', language, stat, value });
                }).flat();
            }).flat();
        }
        else {
            console.warn(`!!!!!!!!! No added stats for ${repoPath} in ${clocDiffStat.yearMonth}
            with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`);
        }
        let removedFlat = [];
        if (clocDiffStat.removed) {
            removedFlat = Object.entries(clocDiffStat.removed).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return Object.assign(Object.assign({}, base), { diffType: 'removed', language, stat, value });
                }).flat();
            }).flat();
        }
        else {
            console.warn(`!!!!!!!!! No removed stats for ${repoPath} in ${clocDiffStat.yearMonth}
        with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`);
        }
        let modifiedFlat = [];
        if (clocDiffStat.modified) {
            modifiedFlat = Object.entries(clocDiffStat.modified).map(([language, clocStats]) => {
                return Object.entries(clocStats).map(([stat, value]) => {
                    return Object.assign(Object.assign({}, base), { diffType: 'modified', language, stat, value });
                }).flat();
            }).flat();
        }
        else {
            console.warn(`!!!!!!!!! No modified stats for ${repoPath} in ${clocDiffStat.yearMonth}
        with commits ${clocDiffStat.leastRecentCommitSha} and ${clocDiffStat.mostRecentCommitSha}`);
        }
        return [...sameFlat, ...addedFlat, ...removedFlat, ...modifiedFlat];
    });
    return clocDiffTypeStatsListFlat.flat();
}
exports.flattenClocDiffStatsDict = flattenClocDiffStatsDict;
//# sourceMappingURL=cloc-diff-repos.js.map