#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_merge_request_analysis_1 = require("../core/analyze-merge-requests/launch-merge-request-analysis");
const launch_read_repos_commits_1 = require("../core/analyze-repos/launch-read-repos-commits");
const launch_clone_group_projects_1 = require("../core/clone-group-repos/launch-clone-group-projects");
const command = process.argv[2];
switch (command) {
    case 'analyze-merge-requests':
        (0, launch_merge_request_analysis_1.launchMergeRequestAnalysis)();
        break;
    case 'clone-group-projects':
        (0, launch_clone_group_projects_1.launchCloneGroupProjects)();
        break;
    case 'read-repos-commits':
        (0, launch_read_repos_commits_1.launchReadReposCommits)();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
//# sourceMappingURL=command.js.map