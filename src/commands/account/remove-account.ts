import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../../lib/config';

export function createRemoveAccountCommand(): Command {
  return new Command('remove')
    .arguments('<name>')
    .description('Remove an account')
    .action(async (name: string) => {
      const configManager = new ConfigManager();
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to remove account "${name}"?`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Aborted.'));
        return;
      }

      try {
        await configManager.removeAccount(name);
        console.log(chalk.green(`✅ Account "${name}" removed successfully!`));
      } catch (error) {
        console.error(chalk.red(`❌ Error removing account: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}