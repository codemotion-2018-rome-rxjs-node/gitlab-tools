"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenMonthlyClocDiffStatsDict = exports.calculateMonthlyClocDiffsOnRepos = exports.calculateClocDiffsOnRepos = void 0;
var path_1 = require("path");
var observable_fs_1 = require("observable-fs");
var rxjs_1 = require("rxjs");
var config_1 = require("../../../internals/config");
var repo_cloc_diff_functions_1 = require("../../../internals/git-functions/repo-cloc-diff.functions");
var repo_functions_1 = require("../../../internals/git-functions/repo.functions");
var repo_functions_2 = require("../../../internals/git-functions/repo.functions");
var csv_tools_1 = require("@enrico.piccinin/csv-tools");
function calculateClocDiffsOnRepos(folderPath, outdir, languages, fromDate, toDate, concurrency, excludeRepoPaths) {
    if (fromDate === void 0) { fromDate = new Date(0); }
    if (toDate === void 0) { toDate = new Date(Date.now()); }
    if (concurrency === void 0) { concurrency = config_1.CONFIG.CONCURRENCY; }
    if (excludeRepoPaths === void 0) { excludeRepoPaths = []; }
    var startTime = new Date().getTime();
    var folderName = path_1.default.basename(folderPath);
    var pairsCompleted = 0;
    var pairRemaining = 0;
    return (0, repo_functions_1.reposCompactInFolderObs)(folderPath, fromDate, toDate, concurrency, excludeRepoPaths).pipe((0, rxjs_1.concatMap)(function (repo) {
        var repoWithCommitPairs = (0, repo_functions_1.newRepoCompactWithCommitPairs)(repo);
        return (0, rxjs_1.from)(repoWithCommitPairs.commitPairs);
    }), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)(function (commitPairs) {
        pairRemaining = commitPairs.length;
        var sortedByYearMonth = commitPairs.sort(function (a, b) {
            return a.yearMonth.localeCompare(b.yearMonth);
        });
        return (0, rxjs_1.from)(sortedByYearMonth);
    }), (0, rxjs_1.mergeMap)(function (commitPair) {
        return (0, repo_cloc_diff_functions_1.calculateClocGitDiffs)(commitPair, languages).pipe((0, rxjs_1.tap)(function () {
            console.log("====>>>> commit pairs completed: ".concat(pairsCompleted++, " "));
            console.log("====>>>> commit pairs remaining: ".concat(pairRemaining--, " "));
        }));
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)(function (stats) {
        var outFile = path_1.default.join(outdir, "".concat(folderName, "-cloc-diff.json"));
        return writeClocDiffJson(stats, outFile).pipe((0, rxjs_1.map)(function () { return stats; }));
    }), (0, rxjs_1.concatMap)(function (stats) {
        var outFile = path_1.default.join(outdir, "".concat(folderName, "-cloc-diff.csv"));
        return writeClocCsv(stats, outFile).pipe((0, rxjs_1.map)(function () { return stats; }));
    }), (0, rxjs_1.tap)(function () {
        var endTime = new Date().getTime();
        console.log("====>>>> Total time to calculate cloc diffs: ".concat((endTime - startTime) / 1000, " seconds"));
    }));
}
exports.calculateClocDiffsOnRepos = calculateClocDiffsOnRepos;
// calculateMonthlyClocDiffsOnRepos is a function that calculates the monthly cloc diffs on the repos contained in a folder
// for the selected languages and write the results as a json file and as a csv file
function calculateMonthlyClocDiffsOnRepos(folderPath, outdir, languages, fromDate, toDate, concurrency) {
    if (fromDate === void 0) { fromDate = new Date(0); }
    if (toDate === void 0) { toDate = new Date(Date.now()); }
    if (concurrency === void 0) { concurrency = config_1.CONFIG.CONCURRENCY; }
    var folderName = path_1.default.basename(folderPath);
    return (0, repo_functions_2.reposCompactWithCommitsByMonthsInFolderObs)(folderPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)(function (repos) {
        var reposCommits = (0, repo_functions_1.newReposWithCommitsByMonth)(repos);
        var reposCommitsDict = (0, repo_functions_1.repoCommitsByMonthRecordsDict)(reposCommits);
        var repoMonthlyCommitPairs = (0, repo_cloc_diff_functions_1.reposCommitsPairsDiff)(reposCommitsDict);
        return (0, rxjs_1.from)(repoMonthlyCommitPairs);
    }), (0, rxjs_1.mergeMap)(function (repoMonthlyClocDiffs) {
        return (0, repo_cloc_diff_functions_1.calculateMonthlyClocGitDiffs)(repoMonthlyClocDiffs, languages);
    }, concurrency), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)(function (stats) {
        var outFile = path_1.default.join(outdir, "".concat(folderName, "-monthly-cloc-diff.json"));
        return writeMonthlyClocDiffJson(stats, outFile).pipe((0, rxjs_1.map)(function () { return stats; }));
    }), (0, rxjs_1.concatMap)(function (stats) {
        var outFile = path_1.default.join(outdir, "".concat(folderName, "-monthly-cloc-diff.csv"));
        return writeMonthlyClocCsv(stats, outFile).pipe((0, rxjs_1.map)(function () { return stats; }));
    }));
}
exports.calculateMonthlyClocDiffsOnRepos = calculateMonthlyClocDiffsOnRepos;
var writeClocDiffJson = function (stats, outFile) {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: function () { return console.log("====>>>> Cloc diff stats JSON written in file: ".concat(outFile)); },
    }), (0, rxjs_1.map)(function () { return stats; }));
};
var writeClocCsv = function (stats, outFile) {
    return (0, observable_fs_1.writeFileObs)(outFile, statsToCsv(stats))
        .pipe((0, rxjs_1.tap)({
        next: function () { return console.log("====>>>> Cloc diff stats csv written in file: ".concat(outFile)); },
    }), (0, rxjs_1.map)(function () { return stats; }));
};
function statsToCsv(reposStats) {
    var csvRecs = reposStats
        .filter(function (stat) { return !stat.clocDiff.error; })
        .map(function (stat) { return flattenClocDiffStat(stat); }).flat();
    return (0, csv_tools_1.toCsv)(csvRecs);
}
function flattenClocDiffStat(stat) {
    var repoPath = stat.repoPath;
    var yearMonth = stat.yearMonth;
    var clocDiffStat = stat.clocDiff;
    var base = {
        repoPath: repoPath,
        yearMonth: yearMonth,
        leastRecentCommit: clocDiffStat.leastRecentCommitSha,
        mostRecentCommit: clocDiffStat.mostRecentCommitSha,
    };
    return clocDiffStatToCsvWithBase(clocDiffStat.diffs, base, repoPath, clocDiffStat.leastRecentCommitSha, clocDiffStat.mostRecentCommitSha);
}
var writeMonthlyClocDiffJson = function (stats, outFile) {
    return (0, observable_fs_1.writeFileObs)(outFile, [JSON.stringify(stats, null, 2)])
        .pipe((0, rxjs_1.tap)({
        next: function () { return console.log("====>>>> Cloc diff stats JSON written in file: ".concat(outFile)); },
    }), (0, rxjs_1.map)(function () { return stats; }));
};
var writeMonthlyClocCsv = function (stats, outFile) {
    return (0, observable_fs_1.writeFileObs)(outFile, monthlyStatsToCsv(stats))
        .pipe((0, rxjs_1.tap)({
        next: function () { return console.log("====>>>> Cloc diff stats csv written in file: ".concat(outFile)); },
    }), (0, rxjs_1.map)(function () { return stats; }));
};
function monthlyStatsToCsv(reposStats) {
    var csvRecs = reposStats.map(function (stats) { return flattenMonthlyClocDiffStatsDict(stats); }).flat();
    return (0, csv_tools_1.toCsv)(csvRecs);
}
function flattenMonthlyClocDiffStatsDict(stats) {
    var repoPath = stats.repoPath;
    var clocDiffStats = stats.clocDiffStats;
    var clocDiffStatsList = Object.keys(clocDiffStats).map(function (yearMonth) {
        return __assign({ yearMonth: yearMonth }, clocDiffStats[yearMonth]);
    });
    var clocDiffStatsListFlat = clocDiffStatsList.map(function (clocDiffStat) {
        var diffTypes = clocDiffStat.diffs;
        var clocDiffStatFlat = __assign(__assign({}, clocDiffStat), diffTypes);
        delete clocDiffStatFlat.diffs;
        return clocDiffStatFlat;
    });
    var clocDiffTypeStatsListFlat = clocDiffStatsListFlat.map(function (clocDiffStat) {
        var base = {
            repoPath: repoPath,
            yearMonth: clocDiffStat.yearMonth,
            lastCommitInMonth: clocDiffStat.mostRecentCommitSha,
            previousMonthCommit: clocDiffStat.leastRecentCommitSha
        };
        return clocDiffStatToCsvWithBase(clocDiffStat, base, repoPath, clocDiffStat.leastRecentCommitSha, clocDiffStat.mostRecentCommitSha);
    });
    return clocDiffTypeStatsListFlat.flat();
}
exports.flattenMonthlyClocDiffStatsDict = flattenMonthlyClocDiffStatsDict;
function clocDiffStatToCsvWithBase(clocDiffStat, base, repoPath, leastRecentCommit, mostRecentCommit) {
    var sameFlat = [];
    if (!clocDiffStat) {
        console.warn('!!!!!!!!! No SAME stats for ${repoPath}');
    }
    if (clocDiffStat.same) {
        sameFlat = Object.entries(clocDiffStat.same).map(function (_a) {
            var language = _a[0], clocStats = _a[1];
            return Object.entries(clocStats).map(function (_a) {
                var stat = _a[0], value = _a[1];
                return __assign(__assign({}, base), { diffType: 'same', language: language, stat: stat, value: value });
            }).flat();
        }).flat();
    }
    else {
        console.warn("!!!!!!!!! No SAME stats for ".concat(repoPath, "\n            with commits ").concat(leastRecentCommit, " and ").concat(mostRecentCommit));
    }
    var addedFlat = [];
    if (clocDiffStat.added) {
        addedFlat = Object.entries(clocDiffStat.added).map(function (_a) {
            var language = _a[0], clocStats = _a[1];
            return Object.entries(clocStats).map(function (_a) {
                var stat = _a[0], value = _a[1];
                return __assign(__assign({}, base), { diffType: 'added', language: language, stat: stat, value: value });
            }).flat();
        }).flat();
    }
    else {
        console.warn("!!!!!!!!! No ADDED stats for ".concat(repoPath, "\n            with commits ").concat(leastRecentCommit, " and ").concat(mostRecentCommit));
    }
    var removedFlat = [];
    if (clocDiffStat.removed) {
        removedFlat = Object.entries(clocDiffStat.removed).map(function (_a) {
            var language = _a[0], clocStats = _a[1];
            return Object.entries(clocStats).map(function (_a) {
                var stat = _a[0], value = _a[1];
                return __assign(__assign({}, base), { diffType: 'removed', language: language, stat: stat, value: value });
            }).flat();
        }).flat();
    }
    else {
        console.warn("!!!!!!!!! No REMOVED stats for ".concat(repoPath, "\n            with commits ").concat(leastRecentCommit, " and ").concat(mostRecentCommit));
    }
    var modifiedFlat = [];
    if (clocDiffStat.modified) {
        modifiedFlat = Object.entries(clocDiffStat.modified).map(function (_a) {
            var language = _a[0], clocStats = _a[1];
            return Object.entries(clocStats).map(function (_a) {
                var stat = _a[0], value = _a[1];
                return __assign(__assign({}, base), { diffType: 'modified', language: language, stat: stat, value: value });
            }).flat();
        }).flat();
    }
    else {
        console.warn("!!!!!!!!! No MODIFIED stats for ".concat(repoPath, "\n            with commits ").concat(leastRecentCommit, " and ").concat(mostRecentCommit));
    }
    var csvRecords = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], sameFlat, true), addedFlat, true), removedFlat, true), modifiedFlat, true);
    return csvRecords;
}
