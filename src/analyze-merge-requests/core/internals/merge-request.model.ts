export interface MergeRequestCompact {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    state: string;
    created_at: string;
    created_at_YYYY_MM: string;
    updated_at: string;
    merged_by: string;  // merged_by.username
    merged_at: string;
    merged_at_YYYY_MM: string;
    closed_by: string;  // closed_by.username
    closed_at: string;
    closed_at_YYYY_MM: string;
    author: string;  // author.username
    assignee: string;  // assignee.username
    draft: boolean;
    work_in_progress: boolean;
    web_url: string;
    time_estimate: number;  // time_stats.time_estimate
    time_spent: number;  // time_stats.total_time_spent
    days_to_merge: number | null;
    days_to_close: number | null;
    isLikelyBug: boolean;
}

export function newMergeRequestCompact(mergeRequest: MergeRequest): MergeRequestCompact {
    const title = mergeRequest.title.replaceAll(',', '-')
    const mergeRequestCsv = {
        id: mergeRequest.id,
        iid: mergeRequest.iid,
        project_id: mergeRequest.project_id,
        title,
        state: mergeRequest.state,
        created_at: mergeRequest.created_at,
        created_at_YYYY_MM: yyyy_mm(mergeRequest.created_at),
        updated_at: mergeRequest.updated_at,
        merged_by: mergeRequest.merged_by?.username,
        merged_at: mergeRequest.merged_at,
        merged_at_YYYY_MM: yyyy_mm(mergeRequest.merged_at),
        closed_by: mergeRequest.closed_by?.username,
        closed_at: mergeRequest.closed_at,
        closed_at_YYYY_MM: yyyy_mm(mergeRequest.closed_at),
        author: mergeRequest.author?.username,
        assignee: mergeRequest.assignee?.username,
        draft: false,
        work_in_progress: false,
        web_url: mergeRequest.web_url,
        time_estimate: mergeRequest.time_stats?.time_estimate,
        time_spent: mergeRequest.time_stats?.total_time_spent,
        days_to_merge: daysBetween(mergeRequest.created_at, mergeRequest.merged_at),
        days_to_close: daysBetween(mergeRequest.created_at, mergeRequest.closed_at),
        isLikelyBug: isLikelyBug(mergeRequest),
    }
    return mergeRequestCsv
}

function daysBetween(from: string, to: string) {
    if (!from || !to) {
        return null
    }
    const diffInMs = new Date(to).getTime() - new Date(from).getTime()
    const diff = Math.round(diffInMs / (1000 * 60 * 60 * 24))
    return diff
}

function yyyy_mm(date: string) {
    if (!date) {
        return ''
    }
    return date.slice(0, 7)
}

function isLikelyBug(mergeRequest: MergeRequest) {
    const title = mergeRequest.title.toLowerCase()
    const isBug = title.includes('bug') || title.includes('fix')
    return isBug
}


export interface MergeRequest {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    state: string;
    created_at: string;
    updated_at: string;
    merged_by: Assignee;
    merge_user: Assignee;
    merged_at: string;
    closed_by: Assignee;
    closed_at: string;
    target_branch: string;
    source_branch: string;
    user_notes_count: number;
    upvotes: number;
    downvotes: number;
    author: Assignee;
    assignees: Assignee[];
    assignee: Assignee;
    reviewers: Assignee[];
    source_project_id: number;
    target_project_id: number;
    labels: any[];
    draft: boolean;
    work_in_progress: boolean;
    milestone: null;
    merge_when_pipeline_succeeds: boolean;
    merge_status: string;
    detailed_merge_status: string;
    sha: string;
    merge_commit_sha: string;
    squash_commit_sha: string;
    discussion_locked: null;
    should_remove_source_branch: boolean;
    force_remove_source_branch: boolean;
    reference: string;
    references: References;
    web_url: string;
    time_stats: TimeStats;
    squash: boolean;
    squash_on_merge: boolean;
    task_completion_status: TaskCompletionStatus;
    has_conflicts: boolean;
    blocking_discussions_resolved: boolean;
}

export interface Assignee {
    id: number;
    username: string;
    name: string;
    state: string;
    avatar_url: string;
    web_url: string;
}

export interface References {
    short: string;
    relative: string;
    full: string;
}

export interface TaskCompletionStatus {
    count: number;
    completed_count: number;
}

export interface TimeStats {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: null;
    human_total_time_spent: null;
}