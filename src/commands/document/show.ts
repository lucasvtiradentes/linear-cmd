import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { type DocumentShowOptions } from '../../schemas/definitions/document.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createShowDocumentCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.DOCUMENT,
    SubCommandNames.DOCUMENT_SHOW,
    async (idOrUrl: string, options: DocumentShowOptions) => {
      try {
        const linearClient = new LinearAPIClient();

        logger.loading('Fetching document details...');
        const documentData = await linearClient.getDocumentByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          logger.json(documentData);
        } else {
          logger.plain(linearClient.formatDocument(documentData));
        }
      } catch (error) {
        logger.error('Error fetching document', error);
        process.exit(1);
      }
    }
  );
}
