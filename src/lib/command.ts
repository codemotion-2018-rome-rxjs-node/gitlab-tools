#!/usr/bin/env node

import { launchMergeRequestAnalysis } from '../core/analyze-merge-requests/launch-merge-request-analysis';

const command = process.argv[2];

switch (command) {
    case 'analyze-merge-requests':
        launchMergeRequestAnalysis();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
