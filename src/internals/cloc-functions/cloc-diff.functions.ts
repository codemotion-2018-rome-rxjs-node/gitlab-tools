import { toArray, map, catchError, EMPTY } from "rxjs";

import { CONFIG } from "../config";
import { executeCommandObs } from "../execute-command/execute-command";
import { ClocDiffStats } from "./cloc-diff.model";

// runClocDiff is a function that runs the cloc command to calculate the differences (restricted to the selected languages) between 
// 2 commits of the same repo and returns the result in the form of a ClocDiffLanguageStats array
export function runClocDiff(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './'
) {
    const cmd = buildClocDiffAllCommand(mostRecentCommit, leastRecentCommit, languages, folderPath);
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandObs(
        'run cloc --git-diff-all', cmd
    ).pipe(
        toArray(),
        map((linesFromStdOutAndStdErr) => {
            let output = ''
            linesFromStdOutAndStdErr.forEach((line) => {
                if (line.startsWith('from stderr: ')) {
                    console.error(`Error in runClocDiff for folder "${folderPath}"\nError: ${line}`)
                    console.error(`Command erroring:`)
                    console.error(`${cmd}`)
                }
                if (line.startsWith('from stdout: ')) {
                    output = line.substring('from stdout: '.length)
                }
            })
            if (!output) {
                throw new Error('We expect one line to start with "from stdout: "')
            }

            let diffs: any
            try {
                diffs = JSON.parse(output);
            } catch (error) {
                const err = `Error in runClocDiff for folder "${folderPath}"\nError: ${error}
                Output: ${output}
                Command: ${cmd}`
                console.error(err)
                const clocOutputJson: ClocDiffStats = {
                    mostRecentCommitSha: mostRecentCommit,
                    leastRecentCommitSha: leastRecentCommit,
                    diffs,
                    error: err
                }
                return clocOutputJson
            }
            const clocOutputJson: ClocDiffStats = {
                mostRecentCommitSha: mostRecentCommit,
                leastRecentCommitSha: leastRecentCommit,
                diffs
            }
            delete (clocOutputJson as any).header;
            return clocOutputJson;
        }),
        catchError((error) => {
            console.error(`Error in runClocDiff for folder "${folderPath}"\nError: ${error}`)
            console.error(`Command: ${cmd}`)
            return EMPTY
        })
    );
}

export function buildClocDiffAllCommand(
    mostRecentCommit: string,
    leastRecentCommit: string,
    languages: string[],
    folderPath = './'
) {
    const cdCommand = `cd ${folderPath}`
    const clocDiffAllCommand = `cloc --git-diff-all --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    // const clocDiffAllCommand = `cloc --diff --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    const languagesString = languages.join(',')
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : ''
    const commitsFilter = `${leastRecentCommit} ${mostRecentCommit}`
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`
}
