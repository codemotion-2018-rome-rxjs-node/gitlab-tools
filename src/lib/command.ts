#!/usr/bin/env node

import { launchMergeRequestAnalysis } from '../apps/analyze-merge-requests/launch-analyze-merge-request';
import { launchCloneGroupProjects } from '../apps/clone-group-repos/launch-clone-group-projects';
import { launchWriteGroupProjects } from '../apps/write-group-projects/launch-write-group-projects';

const command = process.argv[2];

const commandsAvailable: { [command: string]: () => void } = {
    'analyze-merge-requests': launchMergeRequestAnalysis,
    'write-group-projects': launchWriteGroupProjects,
    'clone-group-projects': launchCloneGroupProjects,
}

const functionForCommand = commandsAvailable[command];

if (functionForCommand) {
    functionForCommand();
} else {
    console.log(`Command ${command} not found`);
    console.log(`Commands allowed:`)

    Object.keys(commandsAvailable).forEach(command => {
        console.log(command);
    })
}


