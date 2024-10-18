"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareForkFromLastTagOrDefaultBranch$ = exports.writeCompareForksWithFileDetailsInGroupToCsv$ = exports.writeCompareForksInGroupToCsv$ = exports.compareForksInGroupWithFileDetails$ = exports.compareForksInGroup$ = void 0;
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const observable_fs_1 = require("observable-fs");
const csv_tools_1 = require("@enrico.piccinin/csv-tools");
const project_1 = require("./project");
const branches_tags_1 = require("./branches-tags");
const group_1 = require("./group");
//********************************************************************************************************************** */
//****************************   APIs                               **************************************************** */
//********************************************************************************************************************** */
function compareForksInGroup$(gitLabUrl, token, groupId) {
    let count = 0;
    return (0, group_1.fetchAllGroupProjects$)(gitLabUrl, token, groupId).pipe((0, rxjs_1.filter)(project => {
        return project.forked_from_project !== undefined;
    }), (0, rxjs_1.concatMap)(project => {
        count += 1;
        console.log(`====>>>> Analyzing project ${project.name_with_namespace}`);
        return compareForkFromLastTagOrDefaultBranch$(gitLabUrl, token, project.id.toString());
    }), (0, rxjs_1.tap)({
        complete: () => {
            console.log(`====>>>> Total number of for projects analyzed`, count);
        }
    }));
}
exports.compareForksInGroup$ = compareForksInGroup$;
function compareForksInGroupWithFileDetails$(gitLabUrl, token, groupId) {
    return compareForksInGroup$(gitLabUrl, token, groupId).pipe((0, rxjs_1.concatMap)(compareResult => {
        // for each diff in diffs create a new object with all the fields of the compareResult and the diff
        const { diffs } = compareResult, compareResultWitNoDiffs = __rest(compareResult, ["diffs"]);
        const compareResultForFiles = diffs.map(diff => {
            var _a;
            const diffLines = diff.diff.split('\n');
            // numOfLinesAdded and numOfLinesDeleted are the number of lines added and deleted in the diff
            let numOfLinesAdded = 0;
            let numOfLinesDeleted = 0;
            diffLines.forEach(line => {
                if (line.startsWith('+')) {
                    numOfLinesAdded += 1;
                }
                if (line.startsWith('-')) {
                    numOfLinesDeleted += 1;
                }
            });
            const extension = path_1.default.extname(diff.new_path);
            return Object.assign(Object.assign({}, compareResultWitNoDiffs), { new_path: diff.new_path, old_path: diff.old_path, extension,
                numOfLinesAdded,
                numOfLinesDeleted, renamed_file: diff.renamed_file, deleted_file: diff.deleted_file, generated_file: (_a = diff.generated_file) !== null && _a !== void 0 ? _a : false });
        });
        return compareResultForFiles;
    }));
}
exports.compareForksInGroupWithFileDetails$ = compareForksInGroupWithFileDetails$;
function writeCompareForksInGroupToCsv$(gitLabUrl, token, groupId, outdir) {
    let groupName;
    return (0, group_1.readGroup$)(gitLabUrl, token, groupId).pipe((0, rxjs_1.concatMap)(group => {
        groupName = group.name;
        return compareForksInGroup$(gitLabUrl, token, groupId);
    }), (0, rxjs_1.map)(compareResult => {
        // delete the diffs field from the compareResult
        delete compareResult.diffs;
        return compareResult;
    }), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((compareResult) => {
        const timeStampYYYYMMDDHHMMSS = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const outFile = path_1.default.join(outdir, `${groupName}-compare-result-${timeStampYYYYMMDDHHMMSS}.csv`);
        return writeCompareResultsToCsv$(compareResult, groupName, outFile);
    }));
}
exports.writeCompareForksInGroupToCsv$ = writeCompareForksInGroupToCsv$;
function writeCompareForksWithFileDetailsInGroupToCsv$(gitLabUrl, token, groupId, outdir) {
    let groupName;
    return (0, group_1.readGroup$)(gitLabUrl, token, groupId).pipe((0, rxjs_1.concatMap)(group => {
        groupName = group.name;
        return compareForksInGroupWithFileDetails$(gitLabUrl, token, groupId);
    }), (0, csv_tools_1.toCsvObs)(), (0, rxjs_1.toArray)(), (0, rxjs_1.concatMap)((compareResult) => {
        const timeStampYYYYMMDDHHMMSS = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const outFile = path_1.default.join(outdir, `${groupName}-compare-result-file-details-${timeStampYYYYMMDDHHMMSS}.csv`);
        return writeCompareResultsToCsv$(compareResult, groupName, outFile);
    }));
}
exports.writeCompareForksWithFileDetailsInGroupToCsv$ = writeCompareForksWithFileDetailsInGroupToCsv$;
//********************************************************************************************************************** */
//****************************               Internals              **************************************************** */
//********************************************************************************************************************** */
// these functions may be exported for testing purposes
function compareForkFromLastTagOrDefaultBranch$(gitLabUrl, token, projectId) {
    const projectdata$ = (0, project_1.readProject$)(gitLabUrl, token, projectId).pipe((0, rxjs_1.filter)(project => {
        if (project.forked_from_project === undefined) {
            console.error(`====>>>> Error: project ${project.name_with_namespace} is not a fork`);
            return false;
        }
        return project.forked_from_project !== undefined;
    }), (0, rxjs_1.map)(project => {
        const upstream = project.forked_from_project;
        const resp = {
            project_name: project.name,
            project_name_with_namespace: project.name_with_namespace,
            project_id: project.id,
            default_branch: project.default_branch,
            created_at: project.created_at,
            updated_at: project.updated_at,
            upstream_repo: upstream,
            upstream_repo_name: upstream === null || upstream === void 0 ? void 0 : upstream.name_with_namespace,
            upstream_repo_id: upstream === null || upstream === void 0 ? void 0 : upstream.id,
            upstream_repo_default_branch: upstream === null || upstream === void 0 ? void 0 : upstream.default_branch,
            upstream_repo_forks_count: upstream === null || upstream === void 0 ? void 0 : upstream.forks_count
        };
        return resp;
    }));
    const lastTag$ = (0, branches_tags_1.getTags$)(gitLabUrl, token, projectId).pipe((0, rxjs_1.map)(tags => {
        if (tags.length === 0) {
            return null;
        }
        // the last tag is the first in the array
        return tags[0];
    }));
    const lastBranch$ = (0, branches_tags_1.getLastBranch$)(gitLabUrl, token, projectId);
    const lastTagOrBranch$ = (0, rxjs_1.forkJoin)([lastTag$, lastBranch$]).pipe((0, rxjs_1.map)(([tag, branch]) => {
        if (tag === null && branch === null) {
            console.error(`====>>>> Error: project ${projectId} has no tags or branches`);
            return null;
        }
        if (tag === null) {
            return branch;
        }
        if (branch === null) {
            return tag;
        }
        if (tag.commit.committed_date > branch.commit.committed_date) {
            return tag;
        }
        return branch;
    }));
    return (0, rxjs_1.forkJoin)([projectdata$, lastTagOrBranch$]).pipe((0, rxjs_1.map)(([projectData, lastTagOrBranch]) => {
        const lastTagOrBranchName = lastTagOrBranch ? lastTagOrBranch.name : projectData.default_branch;
        return { projectData, lastTagOrBranchName };
    }), (0, rxjs_1.filter)(({ projectData, lastTagOrBranchName }) => {
        if (lastTagOrBranchName === undefined || projectData.upstream_repo_default_branch === undefined) {
            console.error(`====>>>> Error: lastTagName or upstream_repo_default_branch for project ${projectData.project_name} is undefined. LastTagName: ${lastTagOrBranchName}, upstream_repo_default_branch: ${projectData.upstream_repo_default_branch}`);
            return false;
        }
        return true;
    }), (0, rxjs_1.concatMap)(({ projectData, lastTagOrBranchName }) => {
        const from_fork_to_upstream$ = (0, project_1.compareProjects$)(gitLabUrl, token, projectData.project_id.toString(), lastTagOrBranchName, projectData.upstream_repo_id, projectData.upstream_repo_default_branch);
        const from_upstream_to_fork$ = (0, project_1.compareProjects$)(gitLabUrl, token, projectData.upstream_repo_id, projectData.upstream_repo_default_branch, projectData.project_id.toString(), lastTagOrBranchName);
        return (0, rxjs_1.forkJoin)([from_fork_to_upstream$, from_upstream_to_fork$]).pipe((0, rxjs_1.map)(([from_fork_to_upstream, from_upstream_to_fork]) => {
            return { from_fork_to_upstream, from_upstream_to_fork, projectData, lastTagOrBranchName };
        }));
    }), (0, rxjs_1.map)(({ from_fork_to_upstream, from_upstream_to_fork, projectData, lastTagOrBranchName }) => {
        const num_commits_ahead = from_upstream_to_fork.commits.length;
        const num_commits_behind = from_fork_to_upstream.commits.length;
        // build the url for GitLab that shows the commits ahead and behind for the forked project, a url like, for instance:
        // "https://git.ad.rgigroup.com/iiab/temporary_forks/payload-builder-core/-/tree/payload-builder-core-310.3.4?ref_type=tags"
        let ahead_behind_commits_url = '---';
        const from_upstream_fork_url = from_upstream_to_fork.web_url;
        // check that there is a '/-/' in the url
        if (!from_upstream_fork_url.includes('/-/')) {
            console.error(`====>>>> Error: from_upstream_fork_url ${from_upstream_fork_url} does not contain '/-/'`);
        }
        else {
            const from_upstream_fork_url_parts = from_upstream_fork_url.split('-');
            const base_part = from_upstream_fork_url_parts[0];
            ahead_behind_commits_url = `${base_part}-/tree/${lastTagOrBranchName}`;
        }
        return {
            project_name: projectData.project_name_with_namespace,
            tag_or_branch: lastTagOrBranchName,
            upstream_repo_name: projectData.upstream_repo_name,
            num_commits_ahead,
            num_commits_behind,
            created: projectData.created_at,
            updated: projectData.updated_at,
            project_id: projectData.project_id,
            upstream_repo_forks_count: projectData.upstream_repo_forks_count,
            web_url_from_upstream_to_fork: from_upstream_to_fork.web_url,
            web_url_from_fork_to_upstream: from_fork_to_upstream.web_url,
            ahead_behind_commits_url: ahead_behind_commits_url,
            // diffs are the same for both from_fork_to_upstream and from_upstream_to_fork
            // diffs is optional since it is not used in the csv file
            diffs: from_fork_to_upstream.diffs
        };
    }));
}
exports.compareForkFromLastTagOrDefaultBranch$ = compareForkFromLastTagOrDefaultBranch$;
const writeCompareResultsToCsv$ = (compareResults, group, outFile) => {
    return (0, observable_fs_1.writeFileObs)(outFile, compareResults)
        .pipe((0, rxjs_1.tap)({
        next: () => console.log(`====>>>> Fork compare result for Group ${group} written in csv file: ${outFile}`),
    }));
};
//# sourceMappingURL=compare-forks.js.map