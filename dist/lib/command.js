#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exec_command_1 = require("../analyze-merge-requests/core/exec-command");
const command = process.argv[2];
switch (command) {
    case 'analyze-merge-requests':
        (0, exec_command_1.launchMergeRequestAnalysis)();
        break;
    default:
        console.log(`Command ${command} not found`);
        break;
}
//# sourceMappingURL=command.js.map