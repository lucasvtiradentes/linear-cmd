import { Command } from 'commander';
import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';

import { createAddDocumentCommand } from './add.js';
import { createDeleteDocumentCommand } from './delete.js';
import { createShowDocumentCommand } from './show.js';

export function createDocumentCommand(): Command {
  const document = createCommandFromSchema(CommandNames.DOCUMENT);

  document.addCommand(createShowDocumentCommand());
  document.addCommand(createAddDocumentCommand());
  document.addCommand(createDeleteDocumentCommand());

  return document;
}
