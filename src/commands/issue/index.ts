import { Command } from 'commander';

import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';
import { createCommentIssueCommand } from './comment-issue.js';
import { createCreateIssueCommand } from './create-issue.js';
import { createListIssuesCommand } from './list-issues.js';
import { createShowIssueCommand } from './show-issue.js';
import { createUpdateIssueCommand } from './update-issue.js';

export function createIssueCommand(): Command {
  const issue = createCommandFromSchema(CommandNames.ISSUE);

  issue.addCommand(createShowIssueCommand());
  issue.addCommand(createCreateIssueCommand());
  issue.addCommand(createListIssuesCommand());
  issue.addCommand(createUpdateIssueCommand());
  issue.addCommand(createCommentIssueCommand());

  return issue;
}
