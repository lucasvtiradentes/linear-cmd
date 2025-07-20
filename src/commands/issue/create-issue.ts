import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';

export function createCreateIssueCommand(): Command {
  return new Command('create')
    .description('Create a new Linear issue')
    .option('-a, --account <account>', 'specify account to use')
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
        // Get account - required
        if (!options.account) {
          console.error(chalk.red('❌ Account is required'));
          console.log(chalk.dim('Use --account flag to specify which account to use'));
          console.log(chalk.dim('Run `linear account list` to see available accounts'));
          return;
        }

        const account = configManager.getWorkspace(options.account);
        if (!account) {
          console.error(chalk.red(`❌ Account '${options.account}' not found`));
          console.log(chalk.dim('Run `linear account list` to see available accounts'));
          return;
        }

        const client = new LinearClient({ apiKey: account.api_key });

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
        console.log(chalk.dim('Creating issue...'));

        const issuePayload: any = {
          teamId,
          title,
          description
        };

        // Add priority if specified
        if (options.priority !== undefined) {
          issuePayload.priority = parseInt(options.priority);
        }

        // Add assignee if specified
        if (options.assignee) {
          const users = await client.users({ filter: { email: { eq: options.assignee } } });
          if (users.nodes.length > 0) {
            issuePayload.assigneeId = users.nodes[0].id;
          } else {
            console.warn(chalk.yellow(`⚠️  User '${options.assignee}' not found, creating without assignee`));
          }
        }

        // Add project if specified
        if (options.project) {
          const projects = await client.projects({ filter: { name: { eq: options.project } } });
          if (projects.nodes.length > 0) {
            issuePayload.projectId = projects.nodes[0].id;
          } else {
            console.warn(chalk.yellow(`⚠️  Project '${options.project}' not found, creating without project`));
          }
        }

        // Add label if specified
        if (options.label) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.label } } });
          if (labels.nodes.length > 0) {
            issuePayload.labelIds = [labels.nodes[0].id];
          } else {
            console.warn(chalk.yellow(`⚠️  Label '${options.label}' not found, creating without label`));
          }
        }

        const issue = await client.createIssue(issuePayload);
        const createdIssue = await issue.issue;

        if (!createdIssue) {
          throw new Error('Failed to create issue');
        }

        console.log(chalk.green(`✅ Issue created successfully!`));
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
        console.error(chalk.red(`❌ Error creating issue: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}
