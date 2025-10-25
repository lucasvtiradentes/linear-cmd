import { LinearClient } from '@linear/sdk';
import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createTestAccountsCommand(): Command {
  return createSubCommandFromSchema(CommandNames.ACCOUNT, SubCommandNames.ACCOUNT_TEST, async () => {
    try {
      const configManager = new ConfigManager();
      const accounts = configManager.getAllAccounts();

      if (accounts.length === 0) {
        logger.warning('No accounts configured. Use "linear account add" to add one.');
        return;
      }

      logger.bold('Testing all accounts:\n');

      for (const account of accounts) {
        try {
          const client = new LinearClient({ apiKey: account.api_key });
          const viewer = await client.viewer;

          logger.success(`${account.name}: ${viewer.name} (${viewer.email})`);
        } catch (error) {
          logger.error(`${account.name}: ${error instanceof Error ? error.message : 'Connection failed'}`);
        }
      }
    } catch (error) {
      logger.error('Error testing accounts', error);
    }
  });
}
