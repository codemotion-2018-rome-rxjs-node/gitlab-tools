import { CommitCompact, CommitsByMonths } from "./commit.model";

export interface RepoCompact {
    path: string;
    commits: CommitCompact[];
    commitsByMonth: CommitsByMonths;
}
