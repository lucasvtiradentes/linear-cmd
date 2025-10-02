import { Command } from 'commander';

import { createShowDocumentCommand } from './show-document.js';

export function createDocumentCommand(): Command {
  const document = new Command('document');
  document.description('Manage Linear documents');

  document.addCommand(createShowDocumentCommand());

  return document;
}
