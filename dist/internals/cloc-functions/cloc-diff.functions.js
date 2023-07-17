"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClocDiffAllCommand = exports.runClocDiff = void 0;
const rxjs_1 = require("rxjs");
const config_1 = require("../config");
const execute_command_1 = require("../execute-command/execute-command");
// runClocDiff is a function that runs the cloc command to calculate the differences (restricted to the selected languages) between 
// 2 commits of the same repo and returns the result in the form of a ClocDiffLanguageStats array
function runClocDiff(mostRecentCommit, leastRecentCommit, languages, folderPath = './') {
    const cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return (0, execute_command_1.executeCommandObs)('run cloc --git-diff-all', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)((linesFromStdOutAndStdErr) => {
        let output = '';
        linesFromStdOutAndStdErr.forEach((line) => {
            if (line.startsWith('from stderr: ')) {
                console.error(`Error in runClocDiff for folder "${folderPath}"\nError: ${line}`);
            }
            if (line.startsWith('from stdout: ')) {
                output = line.substring('from stdout: '.length);
            }
        });
        if (!output) {
            throw new Error('We expect one line to start with "from stdout: "');
        }
        let diffs;
        try {
            diffs = JSON.parse(output);
        }
        catch (error) {
            console.error(`Error in runClocDiff for folder "${folderPath}"\nError: ${error}`);
            console.error(`Output: ${output}`);
            console.error(`Command: ${cmd}`);
        }
        const clocOutputJson = {
            mostRecentCommitSha: mostRecentCommit,
            leastRecentCommitSha: leastRecentCommit,
            diffs
        };
        delete clocOutputJson.header;
        return clocOutputJson;
    }), (0, rxjs_1.catchError)((error) => {
        console.error(`Error in runClocDiff for folder "${folderPath}"\nError: ${error}`);
        console.error(`Command: ${cmd}`);
        return rxjs_1.EMPTY;
    }));
}
exports.runClocDiff = runClocDiff;
function buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath = './') {
    const cdCommand = `cd ${folderPath}`;
    const clocDiffAllCommand = `cloc --git-diff-all --json --timeout=${config_1.CONFIG.CLOC_TIMEOUT}`;
    const languagesString = languages.join(',');
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : '';
    const commitsFilter = `${mostRecentCommit}  ${leastRecentCommit}`;
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`;
}
exports.buildClocDiffAllCommand = buildClocDiffAllCommand;
//# sourceMappingURL=cloc-diff.functions.js.map