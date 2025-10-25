import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createListAccountsCommand(): Command {
  return createSubCommandFromSchema(CommandNames.ACCOUNT, SubCommandNames.ACCOUNT_LIST, async () => {
    const configManager = new ConfigManager();
    const accounts = configManager.getAllAccounts();

    if (accounts.length === 0) {
      logger.warning('No accounts configured. Use "linear account add" to add one.');
      return;
    }

    logger.bold('\nConfigured accounts:');
    accounts.forEach((account) => {
      const workspaces = account.workspaces?.length ? `[${account.workspaces.join(', ')}]` : '';
      if (workspaces) {
        logger.plain(`  • ${account.name}`);
        logger.dim(`    ${workspaces}`);
      } else {
        logger.plain(`  • ${account.name}`);
      }
    });
  });
}
