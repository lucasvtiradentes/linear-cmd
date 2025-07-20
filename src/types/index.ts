// Re-export config types
export * from './config.js';

export interface IssueData {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  branchName: string;
  state: {
    name: string;
    color: string;
  };
  assignee?: {
    name: string;
    email: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: Array<{
    id: string;
    body: string;
    user: {
      name: string;
      email: string;
    };
    createdAt: Date;
  }>;
  pullRequests: Array<{
    id: string;
    url: string;
    title: string;
    number: number;
    draft: boolean;
    merged: boolean;
    branch: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}
