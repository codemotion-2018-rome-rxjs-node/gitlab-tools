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
                console.error(`Error in runClocDiff for folder "${folderPath}"\nError: ${error}`)
                console.error(`Output: ${output}`)
                console.error(`Command: ${cmd}`)
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
    // const clocDiffAllCommand = `cloc --git-diff-all --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    const clocDiffAllCommand = `cloc --diff --json --timeout=${CONFIG.CLOC_TIMEOUT}`
    const languagesString = languages.join(',')
    const languageFilter = languages.length > 0 ? `--include-lang=${languagesString}` : ''
    const commitsFilter = `${mostRecentCommit}  ${leastRecentCommit}`
    return `${cdCommand} && ${clocDiffAllCommand} ${languageFilter} ${commitsFilter}`
}


// this is the last hash at the moment of the start of the cloc diff test
// 3d299a4175f5501b6ed009114deed7017c10be1f
// I will add 3 files in the folder diff-test under the folder src:
// - file-to-keep-unchaged.ts
// - file-to-change.ts
// - file-to-delete.ts
//
// Then in the next commit I will:
// - delete file-to-delete.ts 
// - I will change the file-to-change.ts by
//      - adding 3 code lines
//      - removing 2 code lines
//      - changing 1 code line
// - I will add file-added.ts in the folder diff-test - 