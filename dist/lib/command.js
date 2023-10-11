#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_merge_request_analysis_1 = require("../core/analyze-merge-requests/launch-merge-request-analysis");
const launch_clone_group_projects_1 = require("../core/clone-group-repos/launch-clone-group-projects");
const launch_read_group_projects_1 = require("../core/read-group-projects/launch-read-group-projects");
const command = process.argv[2];
const commandsAvailable = {
    'analyze-merge-requests': launch_merge_request_analysis_1.launchMergeRequestAnalysis,
    'read-group-projects': launch_read_group_projects_1.launchReadGroupProjects,
    'clone-group-projects': launch_clone_group_projects_1.launchCloneGroupProjects,
};
const functionForCommand = commandsAvailable[command];
if (functionForCommand) {
    functionForCommand();
}
console.log(`Command ${command} not found`);
console.log(`Commands allowed:`);
Object.keys(commandsAvailable).forEach(command => {
    console.log(command);
});
//# sourceMappingURL=command.js.map