import { MergeRequestCompact } from "../../../internals/gitlab-functions/merge-request.model"

export type MergeRequestAnalysis = {
    mergeRequestsCompact: MergeRequestCompact[]
    createdByMonth: Map<string, MergeRequestCompact[]>,
    mergedByMonth: Map<string, MergeRequestCompact[]>,
    closedByMonth: Map<string, MergeRequestCompact[]>,
    byNumOfDaysToMerge: Map<number, MergeRequestCompact[]>,
    byNumOfDaysToClose: Map<number, MergeRequestCompact[]>,
    bugFixes: MergeRequestCompact[],
    bugFixesCreatedByMonth: Map<string, MergeRequestCompact[]>,
    bugFixesMergedByMonth: Map<string, MergeRequestCompact[]>,
    bugFixesClosedByMonth: Map<string, MergeRequestCompact[]>,
    bugFixesByNumOfDaysToMerge: Map<number, MergeRequestCompact[]>,
    bugFixesByNumOfDaysToClose: Map<number, MergeRequestCompact[]>,
    features: MergeRequestCompact[],
    featuresCreatedByMonth: Map<string, MergeRequestCompact[]>,
    featuresMergedByMonth: Map<string, MergeRequestCompact[]>,
    featuresClosedByMonth: Map<string, MergeRequestCompact[]>,
    featuresByNumOfDaysToMerge: Map<number, MergeRequestCompact[]>,
    featuresByNumOfDaysToClose: Map<number, MergeRequestCompact[]>,

    summary: {
        numberOfMergeRequests: number,
        numberOfBugFixes: number,
        numberOfFeatures: number,
    }
    summaryStatsByMonth: SummaryStatsByMonth,
    summaryStatsByNumDays: SummaryStatsByNumDays,
    summaryStatsByAuthor: SummaryStatsByAuthor,
}

export function newMergeRequestAnalysis(mergeRequestsCompact: MergeRequestCompact[]): MergeRequestAnalysis {
    return {
        mergeRequestsCompact: mergeRequestsCompact,
        createdByMonth: new Map(),
        mergedByMonth: new Map(),
        closedByMonth: new Map(),
        byNumOfDaysToMerge: new Map(),
        byNumOfDaysToClose: new Map(),
        bugFixes: [],
        bugFixesCreatedByMonth: new Map(),
        bugFixesMergedByMonth: new Map(),
        bugFixesClosedByMonth: new Map(),
        bugFixesByNumOfDaysToMerge: new Map(),
        bugFixesByNumOfDaysToClose: new Map(),
        features: [],
        featuresCreatedByMonth: new Map(),
        featuresMergedByMonth: new Map(),
        featuresClosedByMonth: new Map(),
        featuresByNumOfDaysToMerge: new Map(),
        featuresByNumOfDaysToClose: new Map(),
        summary: {
            numberOfMergeRequests: 0,
            numberOfBugFixes: 0,
            numberOfFeatures: 0,
        },
        summaryStatsByMonth: new Map(),
        summaryStatsByNumDays: newSummaryStatsByNumDays(),
        summaryStatsByAuthor: newSummaryStatsByAuthor()
    }
}

export type StatsByMonth = {
    mergeRequestsCreated: number,
    mergeRequestsMerged: number,
    mergeRequestsClosed: number,
    bugFixesCreated: number,
    bugFixesMerged: number,
    bugFixesClosed: number,
    featuresCreated: number,
    featuresMerged: number,
    featuresClosed: number,
}
export function newStatsByMonth() {
    return {
        mergeRequestsCreated: 0,
        mergeRequestsMerged: 0,
        mergeRequestsClosed: 0,
        bugFixesCreated: 0,
        bugFixesMerged: 0,
        bugFixesClosed: 0,
        featuresCreated: 0,
        featuresMerged: 0,
        featuresClosed: 0,
    }
}
export type SummaryStatsByMonth = Map<string, StatsByMonth>
export function newSummaryStatsByMonth() {
    return new Map<string, StatsByMonth>()
}

export type SummaryStatsByAuthor = Map<string, number>
export function newSummaryStatsByAuthor() {
    return new Map<string, number>()
}

export type SummaryStatsByNumDays = {
    numMergeRequestsByNumOfDaysToMerge: Map<number, number>,
    numMergeRequestsByNumOfDaysToClose: Map<number, number>,
    numBugFixesByNumOfDaysToMerge: Map<number, number>,
    numBugFixesByNumOfDaysToClose: Map<number, number>,
    numFeaturesByNumOfDaysToMerge: Map<number, number>,
    numFeaturesByNumOfDaysToClose: Map<number, number>,
}
export function newSummaryStatsByNumDays() {
    return {
        numMergeRequestsByNumOfDaysToMerge: new Map(),
        numMergeRequestsByNumOfDaysToClose: new Map(),
        numBugFixesByNumOfDaysToMerge: new Map(),
        numBugFixesByNumOfDaysToClose: new Map(),
        numFeaturesByNumOfDaysToMerge: new Map(),
        numFeaturesByNumOfDaysToClose: new Map(),
    }
}