import { Command } from 'commander';
import chalk from 'chalk';
import { LinearAPIClient } from '../../lib/linear-client';

export function createBranchIssueCommand(): Command {
  return new Command('branch')
    .arguments('<idOrUrl>')
    .description('Get the suggested branch name for an issue')
    .action(async (idOrUrl: string) => {
      try {
        const client = new LinearAPIClient();
        
        const issueData = await client.getIssueByIdOrUrl(idOrUrl);
        console.log(issueData.branchName);
        
      } catch (error) {
        console.error(chalk.red(`❌ Error fetching issue: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    });
}