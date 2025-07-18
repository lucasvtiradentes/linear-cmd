import { Command } from 'commander';
import { createShowIssueCommand } from './show-issue';
import { createBranchIssueCommand } from './branch-issue';

export function createIssueCommand(): Command {
  const issue = new Command('issue');
  issue.description('Manage Linear issues');

  issue.addCommand(createShowIssueCommand());
  issue.addCommand(createBranchIssueCommand());

  return issue;
}