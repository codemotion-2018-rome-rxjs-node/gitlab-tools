#!/usr/bin/env node

import { launchMergeRequestAnalysis } from '../core/analyze-merge-requests/launch-merge-request-analysis';
import { launchReadReposCommits } from '../core/analyze-repos/launch-read-repos-commits';
import { launchCloneGroupProjects } from '../core/clone-group-repos/launch-clone-group-projects';

const command = process.argv[2];

switch (command) {
    case 'analyze-merge-requests':
        launchMergeRequestAnalysis();
        break;
    case 'clone-group-projects':
        launchCloneGroupProjects();
        break;
    case 'read-repos-commits':
        launchReadReposCommits();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
