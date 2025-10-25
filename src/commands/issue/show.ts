import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createShowIssueCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.ISSUE,
    SubCommandNames.ISSUE_SHOW,
    async (idOrUrl: string, options: { format?: string }) => {
      try {
        const linearClient = new LinearAPIClient();

        logger.loading('Fetching issue details...');
        const issueData = await linearClient.getIssueByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          logger.json(issueData);
        } else {
          logger.plain(linearClient.formatIssue(issueData));
        }
      } catch (error) {
        logger.error('Error fetching issue', error);
        process.exit(1);
      }
    }
  );
}
