import { Command } from 'commander';

import { colors } from '../../lib/colors.js';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { type ProjectListOptions } from '../../schemas/definitions/project.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';

export function createListProjectsCommand(): Command {
  return createSubCommandFromSchema(
    CommandNames.PROJECT,
    SubCommandNames.PROJECT_LIST,
    async (options: ProjectListOptions) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);

        // Build filter
        const filter: Record<string, unknown> = {};

        // Handle team filter
        if (options.team) {
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            filter.accessibleTeams = { some: { id: { eq: teams.nodes[0].id } } };
          } else {
            logger.error(`Team '${options.team}' not found`);
            logger.dim('\nAvailable teams:');
            const allTeams = await client.teams();
            allTeams.nodes.forEach((t) => logger.dim(`  - ${t.key}: ${t.name}`));
            process.exit(1);
          }
        }

        logger.loading(`Fetching projects from account: ${account.name}...`);

        const limit = options.limit ? parseInt(options.limit) : 50;
        const projectsConnection = await client.projects({
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: limit
        });

        const projects = projectsConnection.nodes;

        if (projects.length === 0) {
          logger.info('No projects found');
          return;
        }

        if (options.format === 'json') {
          const projectsData = await Promise.all(
            projects.map(async (project) => ({
              id: project.id,
              name: project.name,
              description: project.description,
              state: project.state,
              url: project.url,
              progress: project.progress,
              startDate: project.startDate,
              targetDate: project.targetDate,
              lead: (await project.lead)?.name,
              teams: await project.teams().then((teams) => teams.nodes.map((t) => ({ key: t.key, name: t.name })))
            }))
          );
          logger.json(projectsData);
        } else {
          // Pretty format
          console.log();
          logger.success(`Found ${projects.length} project${projects.length === 1 ? '' : 's'}:\n`);

          // Fetch all leads and teams in parallel for better performance
          const projectsData = await Promise.all(
            projects.map(async (project) => ({
              project,
              lead: await project.lead,
              teams: await project.teams()
            }))
          );

          for (const { project, lead, teams } of projectsData) {
            console.log(colors.boldCyan(`📁 ${project.name}`));
            console.log(colors.dim(`   ${project.url}`));

            if (project.description) {
              console.log(`   ${colors.gray(project.description)}`);
            }

            const details = [];
            if (project.state) {
              details.push(`State: ${project.state}`);
            }
            if (project.progress !== undefined) {
              details.push(`Progress: ${Math.round(project.progress * 100)}%`);
            }
            if (lead) {
              details.push(`Lead: ${lead.name}`);
            }
            if (teams.nodes.length > 0) {
              details.push(`Teams: ${teams.nodes.map((t) => t.key).join(', ')}`);
            }

            if (details.length > 0) {
              console.log(`   ${colors.dim(details.join(' • '))}`);
            }

            console.log();
          }

          if (projects.length >= limit) {
            logger.dim(`(Showing first ${limit} projects. Use --limit to show more)`);
          }
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          logger.error('Error listing projects', error);
        }
        process.exit(1);
      }
    }
  );
}
