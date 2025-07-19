import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config';

export function createAddAccountCommand(): Command {
  return new Command('add').description('Add a new Linear account').action(async () => {
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
      console.log(chalk.dim('Testing API key...'));
      const testClient = new LinearClient({ apiKey: answers.apiKey });
      const viewer = await testClient.viewer;

      await configManager.addAccount(answers.name, answers.apiKey);

      console.log(chalk.green(`✅ Account "${answers.name}" added successfully!`));
      console.log(chalk.dim(`Connected as: ${viewer.name} (${viewer.email})`));
    } catch (error) {
      console.error(chalk.red(`❌ Error adding account: ${error instanceof Error ? error.message : 'Unknown error'}`));
      console.log(chalk.dim('Please check your API key and try again.'));
    }
  });
}
