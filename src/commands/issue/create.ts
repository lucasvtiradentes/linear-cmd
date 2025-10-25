import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';
import { CommandNames, SubCommandNames } from '../../schemas/definitions.js';
import { createSubCommandFromSchema } from '../../schemas/utils.js';
import type { LinearIssuePayload } from '../../types/linear.js';
import { linearIssuePayloadSchema } from '../../types/linear.js';

export function createCreateIssueCommand(): Command {
  return createSubCommandFromSchema(CommandNames.ISSUE, SubCommandNames.ISSUE_CREATE, async (options: any) => {
    const configManager = new ConfigManager();

    try {
      const { client, account } = await getLinearClientForAccount(configManager, options.account);

      // Get teams if not specified or convert team key to ID
      let teamId: string;
      if (options.team) {
        // Convert team key (like "TES") to team ID
        const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
        if (teams.nodes.length > 0) {
          teamId = teams.nodes[0].id;
        } else {
          logger.error(`Team '${options.team}' not found`);
          logger.dim('\nAvailable teams:');
          const allTeams = await client.teams();
          allTeams.nodes.forEach((t) => logger.dim(`  - ${t.key}: ${t.name}`));
          return;
        }
      } else {
        // Interactive team selection
        const teams = await client.teams();
        if (teams.nodes.length === 0) {
          logger.error('No teams found');
          return;
        }

        if (teams.nodes.length === 1) {
          teamId = teams.nodes[0].id;
        } else {
          const teamAnswer = await inquirer.prompt([
            {
              type: 'list',
              name: 'team',
              message: 'Select team:',
              choices: teams.nodes.map((t) => ({ name: `${t.name} (${t.key})`, value: t.id }))
            }
          ]);
          teamId = teamAnswer.team;
        }
      }

      // Get issue details interactively if not provided
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Issue title:',
          when: !options.title,
          validate: (input) => input.length > 0 || 'Title is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Issue description (optional):',
          when: !options.description
        }
      ]);

      const title = options.title || answers.title;
      const description = options.description || answers.description || undefined;

      // Create the issue
      logger.loading(`Creating issue in account: ${account.name}...`);

      const issuePayload: Partial<LinearIssuePayload> = {
        teamId,
        title,
        description
      };

      // Add priority if specified
      if (options.priority !== undefined) {
        const priority = parseInt(options.priority);
        if (priority >= 0 && priority <= 4) {
          issuePayload.priority = priority;
        }
      }

      // Add assignee if specified
      if (options.assignee) {
        const users = await client.users({ filter: { email: { eq: options.assignee } } });
        if (users.nodes.length > 0) {
          issuePayload.assigneeId = users.nodes[0].id;
        } else {
          logger.warning(`User '${options.assignee}' not found, creating without assignee`);
        }
      }

      // Add project if specified
      if (options.project) {
        const projects = await client.projects({ filter: { name: { eq: options.project } } });
        if (projects.nodes.length > 0) {
          issuePayload.projectId = projects.nodes[0].id;
        } else {
          logger.warning(`Project '${options.project}' not found, creating without project`);
        }
      }

      // Add label if specified
      if (options.label) {
        const labels = await client.issueLabels({ filter: { name: { eq: options.label } } });
        if (labels.nodes.length > 0) {
          issuePayload.labelIds = [labels.nodes[0].id];
        } else {
          logger.warning(`Label '${options.label}' not found, creating without label`);
        }
      }

      // Validate the payload
      const validPayload = linearIssuePayloadSchema.parse(issuePayload);

      const issue = await client.createIssue(validPayload);
      const createdIssue = await issue.issue;

      if (!createdIssue) {
        throw new Error('Failed to create issue');
      }

      logger.success('Issue created successfully!');
      logger.info(`📋 ID: ${createdIssue.identifier}`);
      logger.link(createdIssue.url, 'URL:');

      const assignee = await createdIssue.assignee;
      if (assignee) {
        logger.dim(`👤 Assigned to: ${assignee.name}`);
      }

      const project = await createdIssue.project;
      if (project) {
        logger.dim(`📁 Project: ${project.name}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        handleValidationError(error);
      } else {
        logger.error('Error creating issue', error);
      }
    }
  });
}
