import { LinearClient } from '@linear/sdk';

import type { Account } from '../types/local.js';
import { ConfigManager } from './config-manager.js';
import { Logger } from './logger.js';

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
  Logger.error(error.message);
  error.hints.forEach((hint) => {
    Logger.dim(hint);
  });
}
