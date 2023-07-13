export interface CommitCompact {
    sha: string;
    date: Date;
    author: string
}

export interface CommitsByMonths {
    [key: string]: {
        commits: CommitCompact[],
        authors: Set<string>
    }
}
