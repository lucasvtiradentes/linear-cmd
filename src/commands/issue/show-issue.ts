import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { Logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createShowIssueCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.ISSUE,
    SubCommandNames.ISSUE_SHOW,
    async (idOrUrl: string, options: { format?: string }) => {
      try {
        const linearClient = new LinearAPIClient();

        Logger.loading('Fetching issue details...');
        const issueData = await linearClient.getIssueByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          Logger.json(issueData);
        } else {
          Logger.plain(linearClient.formatIssue(issueData));
        }
      } catch (error) {
        Logger.error('Error fetching issue', error);
        process.exit(1);
      }
    }
  );
}
