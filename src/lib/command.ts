#!/usr/bin/env node

import { launchMergeRequestAnalysis } from '../core/analyze-merge-requests/launch-merge-request-analysis';
import { launchReadReposCommits } from '../core/read-repos-commits/launch-count-repos-commits';
import { launchCloneGroupProjects } from '../core/clone-group-repos/launch-clone-group-projects';
import { launchClocRepos } from '../core/cloc-repos/launch-cloc-repos';
import { launchClocDiffRepos, launchMonthlyClocDiffRepos } from '../core/cloc-diff-repos/launch-cloc-diff-repos';
import { launchReadGroupProjects } from '../core/read-group-projects/launch-read-group-projects';

const command = process.argv[2];

switch (command) {
    case 'analyze-merge-requests':
        launchMergeRequestAnalysis();
        break;
    case 'read-group-projects':
        launchReadGroupProjects();
        break;
    case 'clone-group-projects':
        launchCloneGroupProjects();
        break;
    case 'read-repos-commits':
        launchReadReposCommits();
        break;
    case 'cloc-repos':
        launchClocRepos();
        break;
    case 'cloc-monthly-diff-repos':
        launchMonthlyClocDiffRepos();
        break;
    case 'cloc-diff-repos':
        launchClocDiffRepos();
        break;
    default:
        console.log(`Command ${command} not found`);
        console.log(`Commands allowed: 
        analyze-merge-requests, 
        read-group-projects, 
        clone-group-projects, 
        read-repos-commits, 
        cloc-repos, 
        cloc-diff-repos, 
        cloc-monthly-diff-repos`);
        break;
}
