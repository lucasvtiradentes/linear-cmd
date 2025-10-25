import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames } from '../definitions.js';

export const updateCommandDefinition: Command = {
  name: CommandNames.UPDATE,
  description: 'Update linear-cmd to the latest version',
  examples: [`${CLI_NAME} update`]
};
