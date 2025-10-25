import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, LinearAPIClient } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { type DocumentAddOptions } from '../../schemas/definitions/document.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createAddDocumentCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.DOCUMENT,
    SubCommandNames.DOCUMENT_ADD,
    async (options: DocumentAddOptions) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);
        const linearClient = new LinearAPIClient();

        // Get project ID if specified
        let projectId: string | undefined;
        if (options.project) {
          const { projectId: projectIdOrSlug } = linearClient.parseProjectUrl(options.project);

          // Verify the project exists - try by ID first, then by slugId
          try {
            const project = await client.project(projectIdOrSlug);
            projectId = project.id;
          } catch {
            // If ID lookup fails, try searching by slugId
            try {
              const projects = await client.projects({
                filter: { slugId: { eq: projectIdOrSlug } }
              });

              if (projects.nodes.length === 0) {
                logger.error(`Project '${options.project}' not found`);
                process.exit(1);
              }

              projectId = projects.nodes[0].id;
            } catch (error) {
              logger.error(`Project '${options.project}' not found`, error);
              process.exit(1);
            }
          }
        }

        // Get document details interactively if not provided
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Document title:',
            when: !options.title,
            validate: (input) => input.length > 0 || 'Title is required'
          },
          {
            type: 'editor',
            name: 'content',
            message: 'Document content (markdown, will open editor):',
            when: !options.content
          }
        ]);

        const title = options.title || answers.title;
        const content = options.content || answers.content || undefined;

        // Create the document
        logger.loading(`Creating document in account: ${account.name}...`);

        const document = await linearClient.createDocument(account.name, title, {
          content,
          projectId
        });

        logger.success('Document created successfully!');
        logger.info(`📄 Title: ${document.title}`);
        logger.link(document.url, 'URL:');

        if (projectId) {
          logger.dim('📁 Linked to project');
        }
      } catch (error) {
        logger.error('Error creating document', error);
        process.exit(1);
      }
    }
  );
}
