import { Command } from 'commander';

import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';
import { createCommentIssueCommand } from './comment.js';
import { createCreateIssueCommand } from './create.js';
import { createListIssuesCommand } from './list.js';
import { createShowIssueCommand } from './show.js';
import { createUpdateIssueCommand } from './update.js';

export function createIssueCommand(): Command {
  const issue = createCommandFromSchema(CommandNames.ISSUE);

  issue.addCommand(createShowIssueCommand());
  issue.addCommand(createCreateIssueCommand());
  issue.addCommand(createListIssuesCommand());
  issue.addCommand(createUpdateIssueCommand());
  issue.addCommand(createCommentIssueCommand());

  return issue;
}
