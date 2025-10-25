import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export const accountCommandDefinition: Command = {
  name: CommandNames.ACCOUNT,
  description: 'Manage Linear accounts',
  subcommands: [
    {
      name: SubCommandNames.ACCOUNT_ADD,
      description: 'Add a new Linear account',
      examples: [`${CLI_NAME} account add`]
    },
    {
      name: SubCommandNames.ACCOUNT_LIST,
      description: 'List all configured accounts',
      examples: [`${CLI_NAME} account list`]
    },
    {
      name: SubCommandNames.ACCOUNT_REMOVE,
      description: 'Remove a Linear account',
      examples: [`${CLI_NAME} account remove`]
    },
    {
      name: SubCommandNames.ACCOUNT_TEST,
      description: 'Test account connections',
      examples: [`${CLI_NAME} account test`]
    }
  ]
};
