import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';
import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';

export function createTestAccountsCommand(): Command {
  return new Command('test').description('Test all configured accounts').action(async () => {
    try {
      const configManager = new ConfigManager();
      const accounts = configManager.getAllAccounts();

      if (accounts.length === 0) {
        console.log(chalk.yellow('No accounts configured. Use "linear account add" to add one.'));
        return;
      }

      console.log(chalk.bold('Testing all accounts:\n'));

      for (const account of accounts) {
        try {
          const client = new LinearClient({ apiKey: account.api_key });
          const viewer = await client.viewer;

          console.log(`${chalk.green('✅')} ${account.name}: ${viewer.name} (${viewer.email})`);
        } catch (error) {
          console.log(`${chalk.red('❌')} ${account.name}: ${error instanceof Error ? error.message : 'Connection failed'}`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error testing accounts: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}
