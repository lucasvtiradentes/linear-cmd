import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export interface AccountAddOptions {
  name?: string;
  apiKey?: string;
}

export const accountCommandDefinition: Command = {
  name: CommandNames.ACCOUNT,
  description: 'Manage Linear accounts',
  subcommands: [
    {
      name: SubCommandNames.ACCOUNT_ADD,
      description: 'Add a new Linear account',
      flags: [
        {
          name: '--name',
          alias: '-n',
          description: 'Account name',
          type: 'string'
        },
        {
          name: '--api-key',
          alias: '-k',
          description: 'Linear API key',
          type: 'string'
        }
      ],
      examples: [`${CLI_NAME} account add`, `${CLI_NAME} account add --name "work" --api-key "lin_api_..."`]
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
      name: SubCommandNames.ACCOUNT_SELECT,
      description: 'Select the active Linear account',
      examples: [`${CLI_NAME} account select`]
    },
    {
      name: SubCommandNames.ACCOUNT_TEST,
      description: 'Test account connections',
      examples: [`${CLI_NAME} account test`]
    }
  ]
};
