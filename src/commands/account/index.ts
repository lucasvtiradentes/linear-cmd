import { Command } from 'commander';
import { createAddAccountCommand } from './add-account';
import { createListAccountsCommand } from './list-accounts';
import { createRemoveAccountCommand } from './remove-account';
import { createTestAccountsCommand } from './test-accounts';

export function createAccountCommand(): Command {
  const account = new Command('account');
  account.description('Manage Linear accounts');

  account.addCommand(createAddAccountCommand());
  account.addCommand(createListAccountsCommand());
  account.addCommand(createRemoveAccountCommand());
  account.addCommand(createTestAccountsCommand());

  return account;
}