import { map, toArray } from "rxjs";
import { executeCommandNewProcessToLinesObs } from "../execute-command/execute-command";

import { ClocLanguageStats } from "./cloc.model";

// runCloc is a function that runs the cloc command and returns the result in the form of a ClocLanguageStats array
export function runCloc(path: string) {
    // #todo - check if we need to specify { encoding: 'utf-8' } as an argument
    return executeCommandNewProcessToLinesObs('run cloc', 'cloc', ['--json', path]).pipe(
        toArray(),
        map((output) => {
            const clocOutputJson = JSON.parse(output.join('\n'));
            const clocStatsArray: ClocLanguageStats[] = []
            Object.entries(clocOutputJson).forEach(([language, stats]: [string, any]) => {
                if (language !== 'header') {
                    const langStats: ClocLanguageStats = {
                        language,
                        files: stats.nFiles,
                        blank: stats.blank,
                        comment: stats.comment,
                        code: stats.code,
                    }
                    clocStatsArray.push(langStats);
                }
            });
            return clocStatsArray;
        })
    );
}