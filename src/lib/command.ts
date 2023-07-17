#!/usr/bin/env node

import { launchMergeRequestAnalysis } from '../core/analyze-merge-requests/launch-merge-request-analysis';
import { launchReadReposCommits } from '../core/count-repos-commits/launch-count-repos-commits';
import { launchCloneGroupProjects } from '../core/clone-group-repos/launch-clone-group-projects';
import { launchClocRepos } from '../core/cloc-repos/launch-cloc-repos';
import { launchClocDiffRepos } from '../core/cloc-diff-repos/launch-cloc-diff-repos';

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
    case 'cloc-repos':
        launchClocRepos();
        break;
    case 'cloc-diff-repos':
        launchClocDiffRepos();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
