import * as readline from 'node:readline';
import { Command } from 'commander';
import { ConfigManager } from '../../lib/config-manager.js';
import { logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

async function selectAccount(): Promise<void> {
  const configManager = new ConfigManager();
  const accounts = configManager.getAllAccounts();
  const activeAccountName = configManager.getActiveAccountName();

  if (accounts.length === 0) {
    logger.newline();
    logger.warning('⚠  No accounts configured');
    logger.newline();
    logger.info('You need to add an account first.');
    logger.dim(`Run: linear account add`);
    logger.newline();
    process.exit(1);
  }

  logger.newline();
  logger.bold('Configured Accounts:');
  logger.newline();

  accounts.forEach((account, index: number) => {
    const isActive = account.name === activeAccountName;
    const marker = isActive ? '●' : '○';
    const status = isActive ? ' (active)' : '';

    logger.info(`${marker} ${index + 1}. ${account.name}${status}`);
    if (account.team_id) {
      logger.dim(`   Team ID: ${account.team_id}`);
    }
    logger.newline();
  });

  logger.info('─────────────────────────────────────────────────────────────────────');
  logger.newline();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise<string>((resolve) => {
    rl.question('Select account (number or account name): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!choice) {
    logger.newline();
    logger.warning('✗ No selection made');
    logger.newline();
    process.exit(1);
  }

  let selectedAccountName: string | null = null;

  const indexChoice = Number.parseInt(choice, 10);
  if (!Number.isNaN(indexChoice) && indexChoice >= 1 && indexChoice <= accounts.length) {
    selectedAccountName = accounts[indexChoice - 1].name;
  } else {
    const match = accounts.find((a) => a.name.toLowerCase() === choice.toLowerCase());
    if (match) {
      selectedAccountName = match.name;
    }
  }

  if (!selectedAccountName) {
    logger.newline();
    logger.error('✗ Invalid selection');
    logger.newline();
    logger.info('Please enter a valid number or account name.');
    logger.newline();
    process.exit(1);
  }

  const success = configManager.setActiveAccount(selectedAccountName);

  if (success) {
    const account = configManager.getAccount(selectedAccountName);
    if (!account) {
      logger.newline();
      logger.error('✗ Failed to get account details');
      logger.newline();
      process.exit(1);
    }

    logger.newline();
    logger.success('✓ Account selected successfully!');
    logger.newline();
    logger.info(`  Name: ${account.name}`);
    if (account.team_id) {
      logger.dim(`  Team ID: ${account.team_id}`);
    }
    logger.newline();
  } else {
    logger.newline();
    logger.error('✗ Failed to select account');
    logger.newline();
    process.exit(1);
  }
}

export function createSelectAccountCommand(): Command {
  return createSubCommandFromSchema(CommandNames.ACCOUNT, SubCommandNames.ACCOUNT_SELECT, async () => {
    await selectAccount();
  });
}
