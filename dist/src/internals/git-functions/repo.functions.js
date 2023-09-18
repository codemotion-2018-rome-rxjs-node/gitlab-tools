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
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoCommitsByMonthRecords = exports.repoCommitsByMonthRecordsDict = exports.fillMissingMonths = exports.newReposWithCommitsByMonth = exports.newRepoCompactWithCommitsByMonths = exports.newRepoCompactWithCommitPairs = exports.newRepoCompact = exports.reposCompactWithCommitsByMonthsInFolderObs = exports.isToBeExcluded = exports.reposCompactInFolderObs = exports.cloneRepo = void 0;
var rxjs_1 = require("rxjs");
var execute_command_1 = require("../execute-command/execute-command");
var commit_functions_1 = require("./commit.functions");
var repos_in_folder_1 = require("../repos-functions/repos-in-folder");
// cloneRepo clones a repo from a given url to a given path and returns the path of the cloned repo
function cloneRepo(url, repoPath, repoName) {
    if (!url)
        throw new Error("url is mandatory");
    if (!repoPath)
        throw new Error("Path is mandatory");
    var command = "git clone ".concat(url, " ").concat(repoPath.replaceAll(' ', '_'));
    return (0, execute_command_1.executeCommandObs)("Clone ".concat(repoName), command).pipe((0, rxjs_1.tap)(function () { return "".concat(repoName, " cloned"); }), (0, rxjs_1.map)(function () { return repoPath; }), (0, rxjs_1.catchError)(function (err) {
        console.error("!!!!!!!!!!!!!!! Error: while cloning repo \"".concat(repoName, "\" - error code: ").concat(err.code));
        console.error("!!!!!!!!!!!!!!! Command erroring: \"".concat(command, "\""));
        return rxjs_1.EMPTY;
    }));
}
exports.cloneRepo = cloneRepo;
// reposCompactInFolderObs returns an Observable that notifies the list of 
// RepoCompact objects representing all the repos in a given folder
// repos whose name is in the excludeRepoPaths array are excluded, in the excludeRepoPaths array
// wildcards can be used, e.g. ['repo1', 'repo2', 'repo3*'] will exclude repo1, repo2 and all the repos that start with repo3
function reposCompactInFolderObs(folderPath, fromDate, toDate, concurrency, excludeRepoPaths) {
    if (fromDate === void 0) { fromDate = new Date(0); }
    if (toDate === void 0) { toDate = new Date(Date.now()); }
    if (concurrency === void 0) { concurrency = 1; }
    if (excludeRepoPaths === void 0) { excludeRepoPaths = []; }
    var repoPaths = (0, repos_in_folder_1.reposInFolder)(folderPath);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.filter)(function (repoPath) {
        return !isToBeExcluded(repoPath, excludeRepoPaths);
    }), (0, rxjs_1.toArray)(), (0, rxjs_1.tap)(function (repoPaths) {
        console.log("Repos to be analyzed: ".concat(repoPaths.length));
        repoPaths.forEach(function (repoPath) {
            console.log("Repo to be analyzed: ".concat(repoPath));
        });
    }), (0, rxjs_1.concatMap)(function (repoPaths) {
        return (0, rxjs_1.from)(repoPaths);
    }), (0, rxjs_1.mergeMap)(function (repoPath) {
        return newRepoCompact(repoPath, fromDate, toDate);
    }, concurrency));
}
exports.reposCompactInFolderObs = reposCompactInFolderObs;
// isToBeExcluded returns true if the name of the repo is in the excludeRepoPaths array
function isToBeExcluded(repoPath, excludeRepoPaths) {
    var excludeRepoPathsLowerCase = excludeRepoPaths.map(function (excludeRepo) { return excludeRepo.toLowerCase(); });
    var repoPathLowerCase = repoPath.toLowerCase();
    return excludeRepoPathsLowerCase.some(function (excludeRepo) {
        if (excludeRepo.includes('*')) {
            var excludeRepoRegex = new RegExp(excludeRepo.replace('*', '.*'));
            return excludeRepoRegex.test(repoPathLowerCase);
        }
        else {
            return repoPathLowerCase === excludeRepo;
        }
    });
}
exports.isToBeExcluded = isToBeExcluded;
// reposCompactWithCommitsByMonthsInFolderObs returns an Observable that notifies the list of 
// RepoCompactWithCommitsByMonths objects representing all the repos in a given folder
function reposCompactWithCommitsByMonthsInFolderObs(folderPath, fromDate, toDate, concurrency) {
    if (fromDate === void 0) { fromDate = new Date(0); }
    if (toDate === void 0) { toDate = new Date(Date.now()); }
    if (concurrency === void 0) { concurrency = 1; }
    var repoPaths = (0, repos_in_folder_1.reposInFolder)(folderPath);
    return (0, rxjs_1.from)(repoPaths).pipe((0, rxjs_1.mergeMap)(function (repoPath) {
        return newRepoCompactWithCommitsByMonths(repoPath, fromDate, toDate);
    }, concurrency));
}
exports.reposCompactWithCommitsByMonthsInFolderObs = reposCompactWithCommitsByMonthsInFolderObs;
// newRepoCompact returns an Observable that notifies a new RepoCompact
// filled with its commits sorted by date ascending
function newRepoCompact(repoPath, fromDate, toDate) {
    if (fromDate === void 0) { fromDate = new Date(0); }
    if (toDate === void 0) { toDate = new Date(Date.now()); }
    return (0, commit_functions_1.fetchCommits)(repoPath, fromDate, toDate).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(function (commits) {
        var commitsSorted = commits.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
        var repo = { path: repoPath, commits: commitsSorted };
        return repo;
    }), (0, rxjs_1.catchError)(function (err) {
        console.error("Error: while reading the commits of repo \"".concat(repoPath, "\" - error:\n ").concat(JSON.stringify(err, null, 2)));
        return rxjs_1.EMPTY;
    }));
}
exports.newRepoCompact = newRepoCompact;
// newRepoCompactWithCommitPairs is a function that receives a RepoCompact and returns a RepoCompactWithCommitPairs
// with the commitPairs filled
function newRepoCompactWithCommitPairs(repoCompact) {
    var commits = repoCompact.commits;
    var commitPairs = (0, commit_functions_1.buildCommitPairArray)(commits, repoCompact.path);
    var repoCompactWithCommitPairs = __assign(__assign({}, repoCompact), { commitPairs: commitPairs });
    return repoCompactWithCommitPairs;
}
exports.newRepoCompactWithCommitPairs = newRepoCompactWithCommitPairs;
// newRepoCompactWithCommitsByMonths returns an Observable that notifies a new RepoCompactWithCommitsByMonths
// filled with its commits sorted by date ascending
function newRepoCompactWithCommitsByMonths(repoPath, fromDate, toDate) {
    if (fromDate === void 0) { fromDate = new Date(0); }
    if (toDate === void 0) { toDate = new Date(Date.now()); }
    return newRepoCompact(repoPath, fromDate, toDate).pipe((0, rxjs_1.map)(function (repoCompact) {
        var _commitsByMonth = (0, commit_functions_1.newCommitsByMonth)(repoCompact.commits);
        var repo = __assign(__assign({}, repoCompact), { commitsByMonth: _commitsByMonth });
        return repo;
    }), (0, rxjs_1.catchError)(function (err) {
        console.error("Error: while reading the commits of repo \"".concat(repoPath, "\" - error:\n ").concat(JSON.stringify(err, null, 2)));
        return rxjs_1.EMPTY;
    }));
}
exports.newRepoCompactWithCommitsByMonths = newRepoCompactWithCommitsByMonths;
// newReposWithCommitsByMonth retuns all the repos that have commits in a given month grouped by month
// #copilot - the entire method has been generated by copilot once I have specified the return type
function newReposWithCommitsByMonth(repos) {
    var reposByMonthUnordered = repos.reduce(function (acc, repo) {
        Object.keys(repo.commitsByMonth).forEach(function (yearMonth) {
            if (!acc[yearMonth]) {
                acc[yearMonth] = [];
            }
            acc[yearMonth].push({
                repoPath: repo.path,
                commits: repo.commitsByMonth[yearMonth].commits,
                authors: Array.from(repo.commitsByMonth[yearMonth].authors)
            });
        });
        return acc;
    }, {});
    var reposByMonthOrdered = Object.keys(reposByMonthUnordered).sort().reduce(function (obj, key) {
        obj[key] = reposByMonthUnordered[key];
        return obj;
    }, {});
    var _a = getMinMax(Object.keys(reposByMonthOrdered)), firstYearMonth = _a[0], lastYearMonth = _a[1];
    fillMissingMonths(reposByMonthOrdered, firstYearMonth, lastYearMonth, []);
    return reposByMonthOrdered;
}
exports.newReposWithCommitsByMonth = newReposWithCommitsByMonth;
// fillMissingMonths fills the missing months in a given ReposWithCommitsByMonths object
// #copilot - the core of the method has been generated by copilot
function fillMissingMonths(dict, firstYearMonth, lastYearMonth, value) {
    var firstYear = parseInt(firstYearMonth.split('-')[0]);
    var firstMonth = parseInt(firstYearMonth.split('-')[1]);
    var firstYearMonthAsNumber = yearMonthAsNumber(firstYear, firstMonth);
    var lastYear = parseInt(lastYearMonth.split('-')[0]);
    var lastMonth = parseInt(lastYearMonth.split('-')[1]);
    var lastYearMonthAsNumber = yearMonthAsNumber(lastYear, lastMonth);
    for (var year = firstYear; year <= lastYear; year++) {
        for (var month = 1; month <= 12; month++) {
            var yearMonth = "".concat(year, "-").concat(month.toString().padStart(2, '0'));
            if (!dict[yearMonth]) {
                if (yearMonthAsNumber(year, month) < firstYearMonthAsNumber)
                    continue;
                if (yearMonthAsNumber(year, month) > lastYearMonthAsNumber)
                    continue;
                dict[yearMonth] = value;
            }
        }
    }
}
exports.fillMissingMonths = fillMissingMonths;
function getMinMax(arr) {
    if (!arr || arr.length === 0) {
        throw new Error("arr must be not null and must have at least one element");
    }
    var minV = arr[0];
    var maxV = arr[0];
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var a = arr_1[_i];
        if (a < minV)
            minV = a;
        if (a > maxV)
            maxV = a;
    }
    return [minV, maxV];
}
function yearMonthAsNumber(year, month) {
    return year * 100 + month;
}
// repoCommitsByMonthRecordsDict returns a dictionary where the repo paths are the keys and the values are the commits grouped by month
function repoCommitsByMonthRecordsDict(reposByMonths) {
    var records = {};
    // sort here is required to make sure that the months are ordered - without this sort the months are not
    // guaranteed to be ordered and therefore the csv records that can be generated downstream
    // are not guaranteed to have the months ordered
    var allYearMonths = Object.keys(reposByMonths).sort().reduce(function (acc, yearMonth) {
        acc[yearMonth] = [];
        return acc;
    }, {});
    var allReposPaths = Object.values(reposByMonths).reduce(function (acc, repos) {
        repos.forEach(function (repo) {
            if (!acc.includes(repo.repoPath)) {
                acc.push(repo.repoPath);
            }
        });
        return acc;
    }, []);
    allReposPaths.forEach(function (repoPath) {
        records[repoPath] = __assign({}, allYearMonths);
    });
    Object.entries(reposByMonths).forEach(function (_a) {
        var yearMonth = _a[0], repos = _a[1];
        repos.forEach(function (repo) {
            var rec = records[repo.repoPath];
            rec[yearMonth] = repo.commits;
        });
    });
    return records;
}
exports.repoCommitsByMonthRecordsDict = repoCommitsByMonthRecordsDict;
// repoCommitsByMonthRecords returns an array of records that contain the repo path and the number of commits for each month
// such records are used to generate the csv file
function repoCommitsByMonthRecords(reposByMonths) {
    var recordDict = {};
    var _repoCommitsByMonthRecordsDict = repoCommitsByMonthRecordsDict(reposByMonths);
    Object.entries(_repoCommitsByMonthRecordsDict).forEach(function (_a) {
        var repoPath = _a[0], repoCommitsByMonth = _a[1];
        var numOfCommitsByMonth = Object.entries(repoCommitsByMonth).reduce(function (acc, _a) {
            var yearMonth = _a[0], commits = _a[1];
            acc[yearMonth] = commits.length;
            return acc;
        }, {});
        recordDict[repoPath] = __assign({}, numOfCommitsByMonth);
    });
    var records = Object.entries(recordDict).map(function (_a) {
        var repoPath = _a[0], commitsByMonth = _a[1];
        return __assign({ repoPath: repoPath }, commitsByMonth);
    });
    return records;
}
exports.repoCommitsByMonthRecords = repoCommitsByMonthRecords;
