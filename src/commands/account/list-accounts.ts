import chalk from 'chalk';
import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';

export function createListAccountsCommand(): Command {
  return new Command('list').description('List all configured accounts').action(async () => {
    const configManager = new ConfigManager();
    const accounts = await configManager.getLegacyAccounts();

    if (accounts.length === 0) {
      console.log(chalk.yellow('No accounts configured. Use "linear account add" to add one.'));
      return;
    }

    console.log(chalk.bold('\nConfigured accounts:'));
    accounts.forEach((account) => {
      const workspaces = account.workspaces?.length ? chalk.dim(`[${account.workspaces.join(', ')}]`) : '';
      console.log(`  • ${account.name} ${workspaces}`);
    });
  });
}
