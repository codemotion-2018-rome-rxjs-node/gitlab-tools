import XLSX from 'xlsx';

import { MergeRequestAnalysis, SummaryStatsByAuthor, SummaryStatsByMonth, SummaryStatsByNumDays } from "./analyze-merge-requests.model";
import { MergeRequestCompact } from '../../../internals/gitlab-functions/merge-request.model';

export function analysisToExcel(mergeRequestAnalysis: MergeRequestAnalysis) {
    const workbook = XLSX.utils.book_new();

    addSummarySheet(workbook, mergeRequestAnalysis.summary)
    addSummaryStatsByMonthSheet(workbook, mergeRequestAnalysis.summaryStatsByMonth)
    addSummaryStatsByAuthorSheet(workbook, mergeRequestAnalysis.summaryStatsByAuthor)
    addSummaryStatsByNumOfDaysSheet(workbook, mergeRequestAnalysis.summaryStatsByNumDays)

    addMergeRequestsSheet(workbook, "All Merge Requests", mergeRequestAnalysis.mergeRequestsCompact);
    addMergeRequestsSheet(workbook, "Bug Fixes", mergeRequestAnalysis.bugFixes);
    addMergeRequestsSheet(workbook, "Features", mergeRequestAnalysis.features);

    addByMonthSheet(workbook, "MR Created By Month", mergeRequestAnalysis.createdByMonth);
    addByMonthSheet(workbook, "MR Merged By Month", mergeRequestAnalysis.mergedByMonth);
    addByMonthSheet(workbook, "MR Closed By Month", mergeRequestAnalysis.closedByMonth);
    addByNumOfDaysSheet(workbook, "MR By Num Of Days To Merge", mergeRequestAnalysis.byNumOfDaysToMerge);
    addByNumOfDaysSheet(workbook, "MR By Num Of Days To Close", mergeRequestAnalysis.byNumOfDaysToClose);

    addByMonthSheet(workbook, "Fix Created By Month", mergeRequestAnalysis.bugFixesCreatedByMonth);
    addByMonthSheet(workbook, "Fix Merged By Month", mergeRequestAnalysis.bugFixesMergedByMonth);
    addByMonthSheet(workbook, "Fix Closed By Month", mergeRequestAnalysis.bugFixesClosedByMonth);
    addByNumOfDaysSheet(workbook, "Fix By Num Of Days To Merge", mergeRequestAnalysis.bugFixesByNumOfDaysToMerge);
    addByNumOfDaysSheet(workbook, "Fix By Num Of Days To Close", mergeRequestAnalysis.bugFixesByNumOfDaysToClose);

    addByMonthSheet(workbook, "Feat Created By Month", mergeRequestAnalysis.featuresCreatedByMonth);
    addByMonthSheet(workbook, "Feat Merged By Month", mergeRequestAnalysis.featuresMergedByMonth);
    addByMonthSheet(workbook, "Feat Closed By Month", mergeRequestAnalysis.featuresClosedByMonth);
    addByNumOfDaysSheet(workbook, "Feat By Num Of Days To Merge", mergeRequestAnalysis.featuresByNumOfDaysToMerge);
    addByNumOfDaysSheet(workbook, "Feat By Num Of Days To Close", mergeRequestAnalysis.featuresByNumOfDaysToClose);

    return workbook;
}

function addSummarySheet<T>(workbook: XLSX.WorkBook, summary: T) {
    const sheet = XLSX.utils.json_to_sheet([summary]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Summary');
}

function addSummaryStatsByMonthSheet(workbook: XLSX.WorkBook, dataMap: SummaryStatsByMonth) {
    const data = Array.from(dataMap.entries()).map(([month, stats]) => {
        return {
            year_month: month,
            ...stats,
        }
    })
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Summary Stats By Month');
}

function addSummaryStatsByAuthorSheet(workbook: XLSX.WorkBook, dataMap: SummaryStatsByAuthor) {
    const data = Array.from(dataMap.entries()).map(([author, numOfMergeRequestsCreated]) => {
        return {
            author,
            numOfMergeRequestsCreated,
        }
    })
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Summary Stats By Auhtor');
}

function addSummaryStatsByNumOfDaysSheet(workbook: XLSX.WorkBook, summaries: SummaryStatsByNumDays) {
    Object.entries(summaries).forEach(([summaryName, summary]) => {
        const data = Array.from(summary.entries()).map(([num_of_days, numOfMergeRequests]) => {
            return {
                num_of_days: num_of_days,
                numOfMergeRequests,
            }
        })
        const sheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, sheet, summaryName.slice(0, 30));
    })
}

function addMergeRequestsSheet(workbook: XLSX.WorkBook, sheetName: string, data: MergeRequestCompact[]) {
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

function addByMonthSheet(workbook: XLSX.WorkBook, sheetName: string, dataMap: Map<string, MergeRequestCompact[]>) {
    let data: ({ year_month: string } & MergeRequestCompact)[] = []
    Array.from(dataMap.entries()).forEach(([month, mergeRequests]) => {
        data.push(...mergeRequests.map(mergeRequest => {
            return {
                year_month: month,
                ...mergeRequest,
            }
        }))
    })
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}

function addByNumOfDaysSheet(workbook: XLSX.WorkBook, sheetName: string, dataMap: Map<number, MergeRequestCompact[]>) {
    let data: ({ num_of_days: number } & MergeRequestCompact)[] = []
    Array.from(dataMap.entries()).forEach(([numDays, mergeRequests]) => {
        data.push(...mergeRequests.map(mergeRequest => {
            return {
                num_of_days: numDays as unknown as number,
                ...mergeRequest,
            }
        }))
    })
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
}