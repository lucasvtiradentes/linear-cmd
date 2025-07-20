import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/client-helper.js';
import { ConfigManager } from '../../lib/config-manager.js';
import { logError, logSuccess, logWarning } from '../../lib/error-handler.js';
import type { LinearIssuePayload } from '../../types/linear.js';
import { linearIssuePayloadSchema } from '../../types/linear.js';

export function createCreateIssueCommand(): Command {
  return new Command('create')
    .description('Create a new Linear issue')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('-t, --title <title>', 'issue title')
    .option('-d, --description <description>', 'issue description')
    .option('-p, --priority <priority>', 'priority (0: none, 1: urgent, 2: high, 3: medium, 4: low)')
    .option('-l, --label <label>', 'label name')
    .option('--team <team>', 'team identifier')
    .option('--project <project>', 'project identifier')
    .option('--assignee <assignee>', 'assignee email or identifier')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);

        // Get teams if not specified
        let teamId = options.team;
        if (!teamId) {
          const teams = await client.teams();
          if (teams.nodes.length === 0) {
            console.error(chalk.red('❌ No teams found'));
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
            type: 'editor',
            name: 'description',
            message: 'Issue description (optional):',
            when: !options.description
          }
        ]);

        const title = options.title || answers.title;
        const description = options.description || answers.description || undefined;

        // Create the issue
        console.log(chalk.dim(`Creating issue in account: ${account.name}...`));

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
            logWarning(`User '${options.assignee}' not found, creating without assignee`);
          }
        }

        // Add project if specified
        if (options.project) {
          const projects = await client.projects({ filter: { name: { eq: options.project } } });
          if (projects.nodes.length > 0) {
            issuePayload.projectId = projects.nodes[0].id;
          } else {
            logWarning(`Project '${options.project}' not found, creating without project`);
          }
        }

        // Add label if specified
        if (options.label) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.label } } });
          if (labels.nodes.length > 0) {
            issuePayload.labelIds = [labels.nodes[0].id];
          } else {
            logWarning(`Label '${options.label}' not found, creating without label`);
          }
        }

        // Validate the payload
        const validPayload = linearIssuePayloadSchema.parse(issuePayload);

        const issue = await client.createIssue(validPayload);
        const createdIssue = await issue.issue;

        if (!createdIssue) {
          throw new Error('Failed to create issue');
        }

        logSuccess('Issue created successfully!');
        console.log(chalk.blue(`📋 ID: ${createdIssue.identifier}`));
        console.log(chalk.dim(`🔗 URL: ${createdIssue.url}`));

        const assignee = await createdIssue.assignee;
        if (assignee) {
          console.log(chalk.dim(`👤 Assigned to: ${assignee.name}`));
        }

        const project = await createdIssue.project;
        if (project) {
          console.log(chalk.dim(`📁 Project: ${project.name}`));
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          logError('Error creating issue', error);
        }
      }
    });
}
