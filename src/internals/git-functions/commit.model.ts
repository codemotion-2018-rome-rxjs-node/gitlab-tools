export interface CommitCompact {
    sha: string;
    date: Date;
    author: string
}

export interface CommitPair {
    repoPath: string,
    yearMonth: string,
    commitPair: [CommitCompact, CommitCompact]
}

export interface CommitsByMonths {
    [yearMonth: string]: {
        commits: CommitCompact[],
        authors: Set<string>
    }
}
