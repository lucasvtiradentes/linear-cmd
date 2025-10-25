import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';

export function createListProjectIssuesCommand(): Command {
  return new Command('issues')
    .arguments('<idOrUrl>')
    .description('List all issues in a project grouped by status')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
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
    });
}
