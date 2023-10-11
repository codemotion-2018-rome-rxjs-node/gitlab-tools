#!/usr/bin/env node

import { launchMergeRequestAnalysis } from '../core/analyze-merge-requests/launch-merge-request-analysis';
import { launchCloneGroupProjects } from '../core/clone-group-repos/launch-clone-group-projects';
import { launchReadGroupProjects } from '../core/read-group-projects/launch-read-group-projects';

const command = process.argv[2];

const commandsAvailable: { [command: string]: () => void } = {
    'analyze-merge-requests': launchMergeRequestAnalysis,
    'read-group-projects': launchReadGroupProjects,
    'clone-group-projects': launchCloneGroupProjects,
}

const functionForCommand = commandsAvailable[command];

if (functionForCommand) {
    functionForCommand();
}

console.log(`Command ${command} not found`);
console.log(`Commands allowed:`)

Object.keys(commandsAvailable).forEach(command => {
    console.log(command);
})
