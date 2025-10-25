import { Command } from 'commander';
import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';

import { createAddDocumentCommand } from './add-document.js';
import { createDeleteDocumentCommand } from './delete-document.js';
import { createShowDocumentCommand } from './show-document.js';

export function createDocumentCommand(): Command {
  const document = createCommandFromSchema(CommandNames.DOCUMENT);

  document.addCommand(createShowDocumentCommand());
  document.addCommand(createAddDocumentCommand());
  document.addCommand(createDeleteDocumentCommand());

  return document;
}
