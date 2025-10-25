import { Command } from 'commander';

import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';
import { createAddAccountCommand } from './add.js';
import { createListAccountsCommand } from './list.js';
import { createRemoveAccountCommand } from './remove.js';
import { createSelectAccountCommand } from './select.js';
import { createTestAccountsCommand } from './test.js';

export function createAccountCommand(): Command {
  const account = createCommandFromSchema(CommandNames.ACCOUNT);

  account.addCommand(createAddAccountCommand());
  account.addCommand(createListAccountsCommand());
  account.addCommand(createRemoveAccountCommand());
  account.addCommand(createSelectAccountCommand());
  account.addCommand(createTestAccountsCommand());

  return account;
}
