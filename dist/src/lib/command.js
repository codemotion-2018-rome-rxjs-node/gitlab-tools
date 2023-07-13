#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const launch_analysis_1 = require("../core/analyze-merge-requests/launch-analysis");
const command = process.argv[2];
switch (command) {
    case 'analyze-merge-requests':
        (0, launch_analysis_1.launchMergeRequestAnalysis)();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
//# sourceMappingURL=command.js.map