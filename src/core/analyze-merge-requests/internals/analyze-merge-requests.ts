import { map } from "rxjs";
import { MergeRequestAnalysis, SummaryStatsByAuthor, SummaryStatsByMonth, SummaryStatsByNumDays, newMergeRequestAnalysis, newStatsByMonth } from "./analyze-merge-requests.model";
import { MergeRequestCompact } from "../../../internals/gitlab-functions/merge-request.model";
import { readMergeRequestsForGroup, toMergeRequestCompact } from "../../../internals/gitlab-functions/merge-requests.functions";

export function runMergeRequestAnalysis(gitLabUrl: string, token: string, groupId: string) {
    return readMergeRequestsForGroup(gitLabUrl, token, groupId).pipe(
        map((mergeRequests) => toMergeRequestCompact(mergeRequests)),
        map(mergeRequestsCompact => {
            return runAnalysis(mergeRequestsCompact)
        })
    )
}

export function runAnalysis(mergeRequestsCompact: MergeRequestCompact[]) {
    const mergeRequestAnalysis = newMergeRequestAnalysis(mergeRequestsCompact)
    let minYearMonth = '9999-12'
    let maxYearMonth = '0000-01'

    const analysisResult = mergeRequestsCompact.reduce((analysis, mergeRequest) => {
        addToMapOfArrays(analysis.createdByMonth, mergeRequest.created_at_YYYY_MM, mergeRequest)
        addToMapOfArrays(analysis.mergedByMonth, mergeRequest.merged_at_YYYY_MM, mergeRequest)
        addToMapOfArrays(analysis.closedByMonth, mergeRequest.closed_at_YYYY_MM, mergeRequest)
        addToMapOfArrays(analysis.byNumOfDaysToMerge, mergeRequest.days_to_merge, mergeRequest)
        addToMapOfArrays(analysis.byNumOfDaysToClose, mergeRequest.days_to_close, mergeRequest)
        if (mergeRequest.isLikelyBug) {
            analysis.bugFixes.push(mergeRequest)
            addToMapOfArrays(analysis.bugFixesCreatedByMonth, mergeRequest.created_at_YYYY_MM, mergeRequest)
            addToMapOfArrays(analysis.bugFixesMergedByMonth, mergeRequest.merged_at_YYYY_MM, mergeRequest)
            addToMapOfArrays(analysis.bugFixesClosedByMonth, mergeRequest.closed_at_YYYY_MM, mergeRequest)
            addToMapOfArrays(analysis.bugFixesByNumOfDaysToMerge, mergeRequest.days_to_merge, mergeRequest)
            addToMapOfArrays(analysis.bugFixesByNumOfDaysToClose, mergeRequest.days_to_close, mergeRequest)
        }
        else {
            analysis.features.push(mergeRequest)
            addToMapOfArrays(analysis.featuresCreatedByMonth, mergeRequest.created_at_YYYY_MM, mergeRequest)
            addToMapOfArrays(analysis.featuresMergedByMonth, mergeRequest.merged_at_YYYY_MM, mergeRequest)
            addToMapOfArrays(analysis.featuresClosedByMonth, mergeRequest.closed_at_YYYY_MM, mergeRequest)
            addToMapOfArrays(analysis.featuresByNumOfDaysToMerge, mergeRequest.days_to_merge, mergeRequest)
            addToMapOfArrays(analysis.featuresByNumOfDaysToClose, mergeRequest.days_to_close, mergeRequest)
        }

        addMergeRequestToSummaryByNumOfDays(mergeRequest, analysis.summaryStatsByNumDays)
        fillSummaryByMonth(mergeRequest, analysis.summaryStatsByMonth)
        fillSummaryByAuthor(mergeRequest, analysis.summaryStatsByAuthor)

        // store the min and max year_month values through the iterations
        const [min, max] = getMinMaxYearMonth([
            mergeRequest.created_at_YYYY_MM,
            mergeRequest.merged_at_YYYY_MM,
            mergeRequest.closed_at_YYYY_MM
        ].filter(yearMonth => yearMonth.length > 0))
        minYearMonth = minYearMonth > min ? min : minYearMonth
        maxYearMonth = maxYearMonth < max ? max : maxYearMonth

        return analysis
    }, mergeRequestAnalysis)

    fillSummary(analysisResult)
    fillGapsInSummaryStatsByMonth(analysisResult.summaryStatsByMonth, minYearMonth, maxYearMonth)
    sortSummaries(analysisResult)

    return analysisResult
}

export function getMinMaxYearMonth(yearMonths: string[]) {
    var minYearMonth = yearMonths[0];
    var maxYearMonth = yearMonths[0];
    for (let a of yearMonths) {
        if (a < minYearMonth) minYearMonth = a;
        if (a > maxYearMonth) maxYearMonth = a;
    }
    return [minYearMonth, maxYearMonth];
}
function addMergeRequestToSummaryByNumOfDays(mergeRequest: MergeRequestCompact, summaryStatsByNumDays: SummaryStatsByNumDays) {
    increaseCountInMap(summaryStatsByNumDays.numMergeRequestsByNumOfDaysToMerge, mergeRequest.days_to_merge)
    increaseCountInMap(summaryStatsByNumDays.numMergeRequestsByNumOfDaysToClose, mergeRequest.days_to_close)
    if (mergeRequest.isLikelyBug) {
        increaseCountInMap(summaryStatsByNumDays.numBugFixesByNumOfDaysToMerge, mergeRequest.days_to_merge)
        increaseCountInMap(summaryStatsByNumDays.numBugFixesByNumOfDaysToClose, mergeRequest.days_to_close)
    }
    else {
        increaseCountInMap(summaryStatsByNumDays.numFeaturesByNumOfDaysToMerge, mergeRequest.days_to_merge)
        increaseCountInMap(summaryStatsByNumDays.numFeaturesByNumOfDaysToClose, mergeRequest.days_to_close)
    }
}
function increaseCountInMap<K>(map: Map<K, number>, key: K) {
    if (!key) {
        return
    }
    if (!map.has(key)) {
        map.set(key, 0)
    }
    map.set(key, map.get(key)! + 1)
}

function addToMapOfArrays<K, V>(map: Map<K, V[]>, key: K, value: V) {
    if (!key) {
        return
    }
    if (!map.has(key)) {
        map.set(key, [])
    }
    map.get(key)!.push(value)
}

function fillSummaryByMonth(
    mergeRequest: MergeRequestCompact,
    summaryStatsByMonth: SummaryStatsByMonth,
) {
    const created = mergeRequest.created_at_YYYY_MM
    const merged = mergeRequest.merged_at_YYYY_MM
    const closed = mergeRequest.closed_at_YYYY_MM
    if (!!created && !summaryStatsByMonth.has(created)) {
        summaryStatsByMonth.set(created, newStatsByMonth())
    }
    if (!!merged && !summaryStatsByMonth.has(merged)) {
        summaryStatsByMonth.set(merged, newStatsByMonth())
    }
    if (!!closed && !summaryStatsByMonth.has(closed)) {
        summaryStatsByMonth.set(closed, newStatsByMonth())
    }

    summaryStatsByMonth.get(created)!.mergeRequestsCreated++
    if (!!mergeRequest.merged_at_YYYY_MM) {
        summaryStatsByMonth.get(merged)!.mergeRequestsMerged++
    }
    if (!!closed) {
        summaryStatsByMonth.get(closed)!.mergeRequestsClosed++
    }
    if (mergeRequest.isLikelyBug) {
        summaryStatsByMonth.get(created)!.bugFixesCreated++
        if (!!merged) {
            summaryStatsByMonth.get(merged)!.bugFixesMerged++
        }
        if (!!closed) {
            summaryStatsByMonth.get(closed)!.bugFixesClosed++
        }
    } else {
        summaryStatsByMonth.get(created)!.featuresCreated++
        if (!!merged) {
            summaryStatsByMonth.get(merged)!.featuresMerged++
        }
        if (!!closed) {
            summaryStatsByMonth.get(closed)!.featuresClosed++
        }
    }
}

function fillSummaryByAuthor(
    mergeRequest: MergeRequestCompact,
    summaryStatsByAuthor: SummaryStatsByAuthor,
) {
    const author = mergeRequest.author
    increaseCountInMap(summaryStatsByAuthor, author)
}

function fillSummary(mergeRequestAnalysis: MergeRequestAnalysis) {
    mergeRequestAnalysis.summary = {
        numberOfMergeRequests: mergeRequestAnalysis.mergeRequestsCompact.length,
        numberOfBugFixes: mergeRequestAnalysis.bugFixes.length,
        numberOfFeatures: mergeRequestAnalysis.features.length,
    }
    mergeRequestAnalysis.summaryStatsByMonth
}

export function fillGapsInSummaryStatsByMonth(summaryStatsByMonth: SummaryStatsByMonth, minYearMonth: string, maxYearMonth: string) {
    let yearMonth = minYearMonth
    while (yearMonth <= maxYearMonth) {
        if (!summaryStatsByMonth.has(yearMonth)) {
            summaryStatsByMonth.set(yearMonth, {
                mergeRequestsCreated: 0,
                mergeRequestsMerged: 0,
                mergeRequestsClosed: 0,
                bugFixesCreated: 0,
                bugFixesMerged: 0,
                bugFixesClosed: 0,
                featuresCreated: 0,
                featuresMerged: 0,
                featuresClosed: 0,
            })
        }
        yearMonth = nextYearMonth(yearMonth)
    }
    return summaryStatsByMonth
}
function nextYearMonth(yearMonth: string) {
    const [yearString, monthString] = yearMonth.split('-')
    const year = parseInt(yearString)
    const month = parseInt(monthString)
    if (month === 12) {
        return `${year + 1}-01`
    } else {
        const monthString = (month + 1).toString().padStart(2, '0')
        return `${year}-${monthString}`
    }
}

// sortSummaries sorts all the summaries present in the analysisResult
function sortSummaries(analysisResult: MergeRequestAnalysis) {
    // sort summaryStatsByMonth
    analysisResult.summaryStatsByMonth = new Map([...analysisResult.summaryStatsByMonth.entries()].sort())

    // sort summaryStatsByAuthor
    analysisResult.summaryStatsByAuthor = new Map([...analysisResult.summaryStatsByAuthor.entries()].sort((a, b) => b[1] - a[1]))

    // sort summaryStatsByNumDays
    const summaryStatsByNumDaysSorted: { [key: string]: Map<number, number> } = {}
    Object.entries(analysisResult.summaryStatsByNumDays).forEach(([key, value]) => {
        summaryStatsByNumDaysSorted[key] = new Map([...value.entries()].sort())
    })
    analysisResult.summaryStatsByNumDays = summaryStatsByNumDaysSorted as SummaryStatsByNumDays


}
