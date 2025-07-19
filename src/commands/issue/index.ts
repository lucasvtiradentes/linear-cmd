import { Command } from 'commander';

import { createBranchIssueCommand } from './branch-issue';
import { createShowIssueCommand } from './show-issue';

export function createIssueCommand(): Command {
  const issue = new Command('issue');
  issue.description('Manage Linear issues');

  issue.addCommand(createShowIssueCommand());
  issue.addCommand(createBranchIssueCommand());

  return issue;
}
