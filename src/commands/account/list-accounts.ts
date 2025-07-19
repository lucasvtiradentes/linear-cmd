import chalk from 'chalk';
import { Command } from 'commander';

import { ConfigManager } from '../../lib/config.js';

export function createListAccountsCommand(): Command {
  return new Command('list').description('List all configured accounts').action(async () => {
    const configManager = new ConfigManager();
    const accounts = configManager.listAccounts();

    if (accounts.length === 0) {
      console.log(chalk.yellow('No accounts configured. Use "linear account add" to add one.'));
      return;
    }

    console.log(chalk.bold('\nConfigured accounts:'));
    accounts.forEach((account) => {
      const workspaces = account.workspaces?.length ? chalk.dim(`[${account.workspaces.join(', ')}]`) : '';
      const activeStatus = account.isActive ? chalk.green('✅ Active') : '';
      console.log(`  • ${account.name} ${workspaces} ${activeStatus}`);
    });
  });
}
