#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_merge_request_analysis_1 = require("../core/analyze-merge-requests/launch-merge-request-analysis");
const launch_count_repos_commits_1 = require("../core/count-repos-commits/launch-count-repos-commits");
const launch_clone_group_projects_1 = require("../core/clone-group-repos/launch-clone-group-projects");
const launch_cloc_repos_1 = require("../core/cloc-repos/launch-cloc-repos");
const launch_cloc_diff_repos_1 = require("../core/cloc-diff-repos/launch-cloc-diff-repos");
const command = process.argv[2];
switch (command) {
    case 'analyze-merge-requests':
        (0, launch_merge_request_analysis_1.launchMergeRequestAnalysis)();
        break;
    case 'clone-group-projects':
        (0, launch_clone_group_projects_1.launchCloneGroupProjects)();
        break;
    case 'read-repos-commits':
        (0, launch_count_repos_commits_1.launchReadReposCommits)();
    case 'cloc-repos':
        (0, launch_cloc_repos_1.launchClocRepos)();
        break;
    case 'cloc-diff-repos':
        (0, launch_cloc_diff_repos_1.launchClocDiffRepos)();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
//# sourceMappingURL=command.js.map