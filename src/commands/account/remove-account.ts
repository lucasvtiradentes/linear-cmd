import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createRemoveAccountCommand(): Command {
  return createSubCommandFromSchema(CommandNames.ACCOUNT, SubCommandNames.ACCOUNT_REMOVE, async () => {
    const configManager = new ConfigManager();
    const accounts = configManager.getAllAccounts();

    if (accounts.length === 0) {
      Logger.warning('No accounts configured.');
      return;
    }

    const { name } = await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: 'Select account to remove:',
        choices: accounts.map((acc) => acc.name)
      }
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove account "${name}"?`,
        default: false
      }
    ]);

    if (!confirm) {
      Logger.warning('Aborted.');
      return;
    }

    try {
      await configManager.removeAccount(name);
      Logger.success(`Account "${name}" removed successfully!`);
    } catch (error) {
      Logger.error('Error removing account', error);
    }
  });
}
