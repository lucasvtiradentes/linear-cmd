import { LinearClient } from '@linear/sdk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';
import { logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createAddAccountCommand(): Command {
  return createSubCommandFromSchema(CommandNames.ACCOUNT, SubCommandNames.ACCOUNT_ADD, async () => {
    const configManager = new ConfigManager();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Account name (e.g., "personal", "work"):',
        validate: (input) => input.length > 0 || 'Account name is required'
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Linear API key:',
        validate: (input) => input.length > 0 || 'API key is required'
      }
    ]);

    try {
      // Test the API key before saving
      logger.loading('Testing API key...');
      const testClient = new LinearClient({ apiKey: answers.apiKey });
      const viewer = await testClient.viewer;

      await configManager.addAccount(answers.name, answers.apiKey);

      logger.success(`Account "${answers.name}" added successfully!`);
      logger.dim(`Connected as: ${viewer.name} (${viewer.email})`);
    } catch (error) {
      logger.error('Error adding account', error);
      logger.dim('Please check your API key and try again.');
    }
  });
}
