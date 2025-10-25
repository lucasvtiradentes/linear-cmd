import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';

export function createShowDocumentCommand(): Command {
  return new Command('show')
    .arguments('<idOrUrl>')
    .description('Show detailed information about a document')
    .option('-f, --format <format>', 'Output format (default: pretty)', 'pretty')
    .action(async (idOrUrl: string, options) => {
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
    });
}
