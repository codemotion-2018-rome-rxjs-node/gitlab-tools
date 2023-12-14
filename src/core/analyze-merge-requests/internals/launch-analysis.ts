import path from "path"
import { concatMap, map, tap } from "rxjs"
import XLSX from 'xlsx';

import { readGroup$ } from "../../../internals/gitlab/group"
import { runMergeRequestAnalysis } from "./analyze-merge-requests"
import { analysisToExcel } from "./to-excel"


export function launchMergRequestAnalysisInternal(gitLabUrl: string, token: string, groupId: string, outdir: string) {
    let _name: string

    return readGroup$(gitLabUrl, token, groupId).pipe(
        concatMap(group => {
            _name = group.name
            return runMergeRequestAnalysis(gitLabUrl, token, groupId)
        }),
        map(analysis => {
            return analysisToExcel(analysis)
        }),
        tap((workbook) => {
            const fileName = path.join(outdir, `${_name}.xls`)
            XLSX.writeFile(workbook, fileName);
            console.log(`====>>>> Workbook written ${fileName}`);
        })
    )
}