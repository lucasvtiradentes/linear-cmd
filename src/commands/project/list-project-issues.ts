import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { type ProjectIssuesOptions } from '../../schemas/definitions/project.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createListProjectIssuesCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.PROJECT,
    SubCommandNames.PROJECT_ISSUES,
    async (idOrUrl: string, options: ProjectIssuesOptions) => {
      try {
        const linearClient = new LinearAPIClient();

        logger.loading('Fetching project issues...');
        const issues = await linearClient.getProjectIssues(idOrUrl);

        if (options.format === 'json') {
          logger.json(issues);
        } else {
          logger.plain(linearClient.formatProjectIssues(issues));
        }
      } catch (error) {
        logger.error('Error fetching project issues', error);
        process.exit(1);
      }
    }
  );
}
