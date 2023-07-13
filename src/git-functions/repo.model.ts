import { CommitCompact, CommitsByMonths } from "./commit.model";

export interface RepoCompact {
    path: string;
    commits: CommitCompact[];
    commitsByMonth: CommitsByMonths;
}

export interface ReposWithCommitsByMonths {
    [yearMonth: string]: {
        repoPath: string,
        commits: CommitCompact[],
        authors: string[]
    }[]
}