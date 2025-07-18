import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../lib/config';
import { LinearClient } from '@linear/sdk';

export function createAccountCommand(): Command {
  const account = new Command('account');
  account.description('Manage Linear accounts');

  account
    .command('add')
    .description('Add a new Linear account')
    .action(async () => {
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

  account
    .command('list')
    .description('List all configured accounts')
    .action(async () => {
      const configManager = new ConfigManager();
      const accounts = configManager.listAccounts();
      
      if (accounts.length === 0) {
        console.log(chalk.yellow('No accounts configured. Use "linear account add" to add one.'));
        return;
      }

      console.log(chalk.bold('\nConfigured accounts:'));
      accounts.forEach(account => {
        const status = account.isActive ? chalk.green('(active)') : '';
        const workspaces = account.workspaces?.length ? chalk.dim(`[${account.workspaces.join(', ')}]`) : '';
        console.log(`  • ${account.name} ${status} ${workspaces}`);
      });
    });

  account
    .command('switch <name>')
    .description('Switch to a different account')
    .action(async (name: string) => {
      const configManager = new ConfigManager();
      
      try {
        await configManager.switchAccount(name);
        console.log(chalk.green(`✅ Switched to account "${name}"`));
      } catch (error) {
        console.error(chalk.red(`❌ Error switching account: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

  account
    .command('remove <name>')
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

  account
    .command('test')
    .description('Test all configured accounts')
    .action(async () => {
      try {
        const configManager = new ConfigManager();
        const accounts = await configManager.getAllAccounts();
        
        if (accounts.length === 0) {
          console.log(chalk.yellow('No accounts configured. Use "linear account add" to add one.'));
          return;
        }

        console.log(chalk.bold('Testing all accounts:\n'));
        
        for (const account of accounts) {
          try {
            const client = new LinearClient({ apiKey: account.apiKey });
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

  return account;
}