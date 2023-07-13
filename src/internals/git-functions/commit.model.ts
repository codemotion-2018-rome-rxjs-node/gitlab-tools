export interface CommitCompact {
    sha: string;
    date: Date;
    author: string
}

export interface CommitsByMonths {
    [yearMonth: string]: {
        commits: CommitCompact[],
        authors: Set<string>
    }
}
