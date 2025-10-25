import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export const completionCommandDefinition: Command = {
  name: CommandNames.COMPLETION,
  description: 'Manage shell completion scripts',
  subcommands: [
    {
      name: SubCommandNames.COMPLETION_INSTALL,
      description: 'Install shell completion',
      examples: [`${CLI_NAME} completion install`]
    }
  ]
};
