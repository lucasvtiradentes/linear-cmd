import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';

import type { Account } from '../types/local.js';
import { ConfigManager } from './config-manager.js';

export class ValidationError extends Error {
  constructor(
    message: string,
    public hints: string[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function getLinearClientForAccount(configManager: ConfigManager, accountName?: string): Promise<{ client: LinearClient; account: Account }> {
  if (!accountName) {
    throw new ValidationError('Account is required', ['Use --account flag to specify which account to use', 'Run `linear account list` to see available accounts']);
  }

  const account = configManager.getAccount(accountName);
  if (!account) {
    throw new ValidationError(`Account '${accountName}' not found`, ['Run `linear account list` to see available accounts']);
  }

  return {
    client: new LinearClient({ apiKey: account.api_key }),
    account
  };
}

export function handleValidationError(error: ValidationError): void {
  console.error(chalk.red(`❌ ${error.message}`));
  error.hints.forEach((hint) => {
    console.log(chalk.dim(hint));
  });
}
