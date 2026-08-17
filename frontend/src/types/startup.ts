export type Repo = {
  name: string;
  path: string;
  fileCount: number;
  branch?: string;
  lastCommit?: string;
  lastCommitUnix?: number;
  lastCommitTitle?: string;
  external?: boolean;
  error?: string;
};
