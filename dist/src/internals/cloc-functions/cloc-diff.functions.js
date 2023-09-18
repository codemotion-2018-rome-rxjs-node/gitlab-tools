"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildClocDiffAllCommand = exports.runClocDiff = void 0;
var rxjs_1 = require("rxjs");
var config_1 = require("../config");
var execute_command_1 = require("../execute-command/execute-command");
// runClocDiff is a function that runs the cloc command to calculate the differences (restricted to the selected languages) between 
// 2 commits of the same repo and returns the result in the form of a ClocDiffLanguageStats array
function runClocDiff(mostRecentCommit, leastRecentCommit, languages, folderPath) {
    if (folderPath === void 0) { folderPath = './'; }
    var cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return (0, execute_command_1.executeCommandObs)('run cloc --git-diff-all', cmd).pipe((0, rxjs_1.toArray)(), (0, rxjs_1.map)(function (linesFromStdOutAndStdErr) {
        var output = '';
        linesFromStdOutAndStdErr.forEach(function (line) {
            if (line.startsWith('from stderr: ')) {
                console.error("Error in runClocDiff for folder \"".concat(folderPath, "\"\nError: ").concat(line));
                console.error("Command erroring:");
                console.error("".concat(cmd));
            }
            if (line.startsWith('from stdout: ')) {
                output = line.substring('from stdout: '.length);
            }
        });
        if (!output) {
            throw new Error('We expect one line to start with "from stdout: "');
        }
        var diffs;
        try {
            diffs = JSON.parse(output);
        }
        catch (error) {
            var err = "Error in runClocDiff for folder \"".concat(folderPath, "\"\nError: ").concat(error, "\n                Output: ").concat(output, "\n                Command: ").concat(cmd);
            console.error(err);
            var clocOutputJson_1 = {
                mostRecentCommitSha: mostRecentCommit,
                leastRecentCommitSha: leastRecentCommit,
                diffs: diffs,
                error: err
            };
            return clocOutputJson_1;
        }
        var clocOutputJson = {
            mostRecentCommitSha: mostRecentCommit,
            leastRecentCommitSha: leastRecentCommit,
            diffs: diffs
        };
        delete clocOutputJson.header;
        return clocOutputJson;
    }), (0, rxjs_1.catchError)(function (error) {
        console.error("Error in runClocDiff for folder \"".concat(folderPath, "\"\nError: ").concat(error));
        console.error("Command: ".concat(cmd));
        return rxjs_1.EMPTY;
    }));
}
exports.runClocDiff = runClocDiff;
function buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath) {
    if (folderPath === void 0) { folderPath = './'; }
    var cdCommand = "cd ".concat(folderPath);
    var clocDiffAllCommand = "cloc --git-diff-all --json --timeout=".concat(config_1.CONFIG.CLOC_TIMEOUT);
    // const clocDiffAllCommand = `cloc --diff --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    var languagesString = languages.join(',');
    var languageFilter = languages.length > 0 ? "--include-lang=".concat(languagesString) : '';
    var commitsFilter = "".concat(leastRecentCommit, " ").concat(mostRecentCommit);
    return "".concat(cdCommand, " && ").concat(clocDiffAllCommand, " ").concat(languageFilter, " ").concat(commitsFilter);
}
exports.buildClocDiffAllCommand = buildClocDiffAllCommand;
