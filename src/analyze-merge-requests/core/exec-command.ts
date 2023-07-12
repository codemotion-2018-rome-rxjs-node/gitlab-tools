import path from 'path';

import { Command } from 'commander';
import { concatMap, map, tap } from 'rxjs';
import XLSX from 'xlsx';

import { runMergeRequestAnalysis } from './internals/read-merge-requests';
import { analysisToExcel } from './internals/to-excel';
import { readGroup } from './internals/read-group';

export function launchMergeRequestAnalysis() {
    console.log('====>>>> Launching Merge Request Analysis')

    const { _gitLabUrl, _token, _groupId, _outdir } = readParams();

    let _name: string

    readGroup(_gitLabUrl, _token, _groupId).pipe(
        concatMap(group => {
            _name = group.name
            return runMergeRequestAnalysis(_gitLabUrl, _token, _groupId)
        }),
        map(analysis => {
            return analysisToExcel(analysis)
        }),
        tap((workbook) => {
            const fileName = path.join(_outdir, `${_name}.xls`)
            XLSX.writeFile(workbook, fileName);
            console.log(`====>>>> Workbook written ${fileName}`);
        })
    ).subscribe()
}

function readParams() {
    const program = new Command();

    program
        .description('A command to analyze the merge requests of a gitlab group')
        .requiredOption(
            '--gitLabUrl <string>',
            `gitlab server (e.g. gitlab.example.com)`,
        )
        .requiredOption(
            '--token <string>',
            `private token to access the gitlab api (e.g. abcde-Abcde1GhijKlmn2Opqrs)`,
        )
        .requiredOption(
            '--groupId <string>',
            `id of the group to analyze (e.g. 1234)`,
        )
        .option(
            '--outdir <string>',
            `directory where the output files will be written (e.g. ./data) - default is the current directory`,
        );

    const _options = program.parse(process.argv).opts();
    const _outdir = _options.outdir || process.cwd();

    return { _gitLabUrl: _options.gitLabUrl, _token: _options.token, _groupId: _options.groupId, _outdir };
}
