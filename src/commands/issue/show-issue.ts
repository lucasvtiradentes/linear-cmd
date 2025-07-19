import chalk from 'chalk';
import { Command } from 'commander';

import { OutputFormatter } from '../../lib/formatter';
import { LinearAPIClient } from '../../lib/linear-client';

export function createShowIssueCommand(): Command {
  return new Command('show')
    .arguments('<idOrUrl>')
    .description('Show detailed information about an issue')
    .option('-c, --comments', 'Show comments (default: true)')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
      try {
        const client = new LinearAPIClient();

        console.log(chalk.dim('Fetching issue details...'));
        const issueData = await client.getIssueByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          console.log(JSON.stringify(issueData, null, 2));
        } else {
          console.log(OutputFormatter.formatIssue(issueData));
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error fetching issue: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });
}
