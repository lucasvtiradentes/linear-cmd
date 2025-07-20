import chalk from 'chalk';
import { Command } from 'commander';

import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';
import type { LinearIssueFilter } from '../../types/linear.js';
import { linearIssueFilterSchema } from '../../types/linear.js';

export function createListIssuesCommand(): Command {
  return new Command('list')
    .description('List Linear issues with filters')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('--assignee <assignee>', 'filter by assignee (email or "me")')
    .option('--state <state>', 'filter by state (e.g., "In Progress", "Todo")')
    .option('--label <label>', 'filter by label name')
    .option('--project <project>', 'filter by project name')
    .option('--team <team>', 'filter by team key')
    .option('--limit <number>', 'number of issues to show', '25')
    .option('--all', 'show all issues (no filters)')
    .option('--json', 'output as JSON')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);
        const limit = parseInt(options.limit);

        // Build filter
        const filter: Partial<LinearIssueFilter> = {};

        // Handle assignee filter
        if (options.assignee) {
          if (options.assignee.toLowerCase() === 'me') {
            const viewer = await client.viewer;
            filter.assignee = { id: { eq: viewer.id } };
          } else {
            const users = await client.users({ filter: { email: { eq: options.assignee } } });
            if (users.nodes.length > 0) {
              filter.assignee = { id: { eq: users.nodes[0].id } };
            } else {
              Logger.error(`User '${options.assignee}' not found`);
              return;
            }
          }
        }

        // Handle state filter
        if (options.state) {
          const states = await client.workflowStates({ filter: { name: { eq: options.state } } });
          if (states.nodes.length > 0) {
            filter.state = { id: { eq: states.nodes[0].id } };
          } else {
            Logger.error(`State '${options.state}' not found`);
            return;
          }
        }

        // Handle label filter
        if (options.label) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.label } } });
          if (labels.nodes.length > 0) {
            filter.labels = { some: { id: { eq: labels.nodes[0].id } } };
          } else {
            Logger.error(`Label '${options.label}' not found`);
            return;
          }
        }

        // Handle project filter
        if (options.project) {
          const projects = await client.projects({ filter: { name: { eq: options.project } } });
          if (projects.nodes.length > 0) {
            filter.project = { id: { eq: projects.nodes[0].id } };
          } else {
            Logger.error(`Project '${options.project}' not found`);
            return;
          }
        }

        // Handle team filter
        if (options.team) {
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            filter.team = { id: { eq: teams.nodes[0].id } };
          } else {
            Logger.error(`Team '${options.team}' not found`);
            return;
          }
        }

        // Fetch issues
        Logger.loading(`Fetching issues from account: ${account.name}...`);

        // Validate and use the filter
        const validFilter = Object.keys(filter).length > 0 ? linearIssueFilterSchema.partial().parse(filter) : undefined;
        const issues = await client.issues({
          first: limit,
          filter: validFilter
        });

        if (issues.nodes.length === 0) {
          Logger.warning('No issues found');
          return;
        }

        // Output results
        if (options.json) {
          const jsonOutput = await Promise.all(
            issues.nodes.map(async (issue) => ({
              id: issue.identifier,
              title: issue.title,
              state: (await issue.state)?.name,
              assignee: (await issue.assignee)?.name,
              project: (await issue.project)?.name,
              labels: await Promise.all((await issue.labels()).nodes.map((l) => l.name)),
              url: issue.url,
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt
            }))
          );
          Logger.json(jsonOutput);
        } else {
          Logger.bold(`\nFound ${issues.nodes.length} issue${issues.nodes.length === 1 ? '' : 's'}:\n`);

          for (const issue of issues.nodes) {
            const state = await issue.state;
            const assignee = await issue.assignee;
            const project = await issue.project;
            const labels = await issue.labels();

            const stateColor = state?.color || '#999999';
            const stateEmoji = getStateEmoji(state?.name);

            Logger.plain(chalk.hex(stateColor)(`${stateEmoji} ${issue.identifier}`) + chalk.white(` ${issue.title}`));

            const metadata = [];
            if (assignee) metadata.push(`👤 ${assignee.name}`);
            if (project) metadata.push(`📁 ${project.name}`);
            if (labels.nodes.length > 0) {
              metadata.push(`🏷️  ${labels.nodes.map((l) => l.name).join(', ')}`);
            }

            if (metadata.length > 0) {
              Logger.dim(`  ${metadata.join(' • ')}`);
            }

            Logger.dim(`  ${issue.url}`);
            Logger.plain('');
          }

          if (issues.pageInfo.hasNextPage) {
            Logger.dim(`\n... and more. Use --limit to see more issues`);
          }
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          Logger.error('Error listing issues', error);
        }
      }
    });
}

function getStateEmoji(stateName?: string): string {
  if (!stateName) return '❓';

  const name = stateName.toLowerCase();
  if (name.includes('done') || name.includes('complete') || name.includes('closed')) return '✅';
  if (name.includes('progress') || name.includes('review')) return '🔄';
  if (name.includes('blocked')) return '🚫';
  if (name.includes('todo') || name.includes('backlog')) return '📋';
  if (name.includes('canceled') || name.includes('cancelled')) return '❌';
  return '📝';
}
