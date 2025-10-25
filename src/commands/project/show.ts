import { Command } from 'commander';
import { LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { type ProjectShowOptions } from '../../schemas/definitions/project.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createShowProjectCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.PROJECT,
    SubCommandNames.PROJECT_SHOW,
    async (idOrUrl: string, options: ProjectShowOptions) => {
      try {
        const linearClient = new LinearAPIClient();

        logger.loading('Fetching project details...');
        const projectData = await linearClient.getProjectByIdOrUrl(idOrUrl);

        if (options.format === 'json') {
          logger.json(projectData);
        } else {
          logger.plain(linearClient.formatProject(projectData));
        }
      } catch (error) {
        logger.error('Error fetching project', error);
        process.exit(1);
      }
    }
  );
}
