import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/client-helper.js';
import { ConfigManager } from '../../lib/config-manager.js';
import { logError, logSuccess, logWarning } from '../../lib/error-handler.js';
import { LinearAPIClient } from '../../lib/linear-client.js';
import type { LinearIssueUpdatePayload } from '../../types/linear.js';
import { linearIssueUpdatePayloadSchema } from '../../types/linear.js';

export function createUpdateIssueCommand(): Command {
  return new Command('update')
    .description('Update a Linear issue')
    .argument('<issue>', 'issue ID or URL')
    .option('-a, --account <account>', 'specify account to use')
    .option('-t, --title <title>', 'new title')
    .option('-d, --description <description>', 'new description')
    .option('-s, --state <state>', 'new state (e.g., "In Progress", "Done")')
    .option('--assignee <assignee>', 'assignee email or "unassign"')
    .option('--project <project>', 'project name or "none" to remove')
    .option('-p, --priority <priority>', 'priority (0: none, 1: urgent, 2: high, 3: medium, 4: low)')
    .option('--add-label <label>', 'add a label')
    .option('--remove-label <label>', 'remove a label')
    .action(async (issueIdOrUrl, options) => {
      const configManager = new ConfigManager();

      try {
        // Parse issue identifier first
        const linearClient = new LinearAPIClient();
        const issueId = linearClient.parseIssueIdentifier(issueIdOrUrl);
        if (!issueId) {
          console.error(chalk.red('❌ Invalid issue ID or URL'));
          return;
        }

        // For update, we'll try to find the account that has access to this issue
        // if not specified
        let account;
        let client: LinearClient | undefined;

        if (options.account) {
          const result = await getLinearClientForAccount(configManager, options.account);
          client = result.client;
          account = result.account;
        } else {
          // Try to find which account can access this issue
          const accounts = configManager.getAllAccounts();
          let foundAccount = null;

          for (const acc of accounts) {
            try {
              const testClient = new LinearClient({ apiKey: acc.api_key });
              await testClient.issue(issueId);
              foundAccount = acc;
              client = testClient;
              break;
            } catch {
              // This account can't access the issue, try next
            }
          }

          if (!foundAccount || !client) {
            throw new ValidationError('Could not find an account with access to this issue', ['Use --account flag to specify which account to use', 'Run `linear account list` to see available accounts']);
          }
          account = foundAccount;
        }

        // Fetch the issue
        const issue = await client.issue(issueId);
        if (!issue) {
          console.error(chalk.red(`❌ Issue ${issueId} not found`));
          return;
        }

        // Build update payload
        const updatePayload: Partial<LinearIssueUpdatePayload> = {};
        let hasUpdates = false;

        // Handle title update
        if (options.title !== undefined) {
          updatePayload.title = options.title;
          hasUpdates = true;
        }

        // Handle description update
        if (options.description !== undefined) {
          updatePayload.description = options.description;
          hasUpdates = true;
        }

        // Handle state update
        if (options.state) {
          const team = await issue.team;
          if (!team) {
            console.error(chalk.red('❌ Unable to get issue team'));
            return;
          }

          const states = await client.workflowStates({
            filter: {
              name: { eq: options.state },
              team: { id: { eq: team.id } }
            }
          });

          if (states.nodes.length > 0) {
            updatePayload.stateId = states.nodes[0].id;
            hasUpdates = true;
          } else {
            console.error(chalk.red(`❌ State '${options.state}' not found`));
            return;
          }
        }

        // Handle assignee update
        if (options.assignee) {
          if (options.assignee.toLowerCase() === 'unassign') {
            updatePayload.assigneeId = null;
            hasUpdates = true;
          } else {
            const users = await client.users({ filter: { email: { eq: options.assignee } } });
            if (users.nodes.length > 0) {
              updatePayload.assigneeId = users.nodes[0].id;
              hasUpdates = true;
            } else {
              console.error(chalk.red(`❌ User '${options.assignee}' not found`));
              return;
            }
          }
        }

        // Handle project update
        if (options.project) {
          if (options.project.toLowerCase() === 'none') {
            updatePayload.projectId = null;
            hasUpdates = true;
          } else {
            const projects = await client.projects({ filter: { name: { eq: options.project } } });
            if (projects.nodes.length > 0) {
              updatePayload.projectId = projects.nodes[0].id;
              hasUpdates = true;
            } else {
              console.error(chalk.red(`❌ Project '${options.project}' not found`));
              return;
            }
          }
        }

        // Handle priority update
        if (options.priority !== undefined) {
          const priority = parseInt(options.priority);
          if (priority >= 0 && priority <= 4) {
            updatePayload.priority = priority;
            hasUpdates = true;
          }
        }

        // Handle label additions
        if (options.addLabel) {
          const labels = await client.issueLabels({ filter: { name: { eq: options.addLabel } } });
          if (labels.nodes.length > 0) {
            const currentLabels = await issue.labels();
            const currentLabelIds = currentLabels.nodes.map((l) => l.id);

            if (!currentLabelIds.includes(labels.nodes[0].id)) {
              updatePayload.labelIds = [...currentLabelIds, labels.nodes[0].id];
              hasUpdates = true;
            } else {
              logWarning(`Label '${options.addLabel}' already added`);
            }
          } else {
            console.error(chalk.red(`❌ Label '${options.addLabel}' not found`));
            return;
          }
        }

        // Handle label removals
        if (options.removeLabel) {
          const currentLabels = await issue.labels();
          const labelToRemove = currentLabels.nodes.find((l) => l.name === options.removeLabel);

          if (labelToRemove) {
            updatePayload.labelIds = currentLabels.nodes.filter((l) => l.id !== labelToRemove.id).map((l) => l.id);
            hasUpdates = true;
          } else {
            logWarning(`Label '${options.removeLabel}' not found on issue`);
          }
        }

        // If no updates specified, show interactive prompt
        if (!hasUpdates) {
          const currentState = await issue.state;
          const currentAssignee = await issue.assignee;

          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'field',
              message: 'What would you like to update?',
              choices: [
                { name: 'Title', value: 'title' },
                { name: 'Description', value: 'description' },
                { name: 'State', value: 'state' },
                { name: 'Assignee', value: 'assignee' },
                { name: 'Priority', value: 'priority' },
                { name: 'Cancel', value: 'cancel' }
              ]
            }
          ]);

          if (answers.field === 'cancel') {
            console.log(chalk.dim('Update cancelled'));
            return;
          }

          switch (answers.field) {
            case 'title': {
              const titleAnswer = await inquirer.prompt([
                {
                  type: 'input',
                  name: 'title',
                  message: 'New title:',
                  default: issue.title
                }
              ]);
              updatePayload.title = titleAnswer.title;
              break;
            }

            case 'description': {
              const descAnswer = await inquirer.prompt([
                {
                  type: 'editor',
                  name: 'description',
                  message: 'New description:',
                  default: issue.description || ''
                }
              ]);
              updatePayload.description = descAnswer.description;
              break;
            }

            case 'state': {
              const issueTeam = await issue.team;
              if (!issueTeam) {
                console.error(chalk.red('❌ Unable to get issue team'));
                return;
              }

              const states = await client.workflowStates({
                filter: { team: { id: { eq: issueTeam.id } } }
              });
              const stateAnswer = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'state',
                  message: 'New state:',
                  choices: states.nodes.map((s) => ({
                    name: s.name,
                    value: s.id,
                    disabled: s.id === currentState?.id
                  }))
                }
              ]);
              updatePayload.stateId = stateAnswer.state;
              break;
            }

            case 'assignee': {
              const users = await client.users();
              const assigneeChoices = [
                { name: 'Unassigned', value: null },
                ...users.nodes.map((u) => ({
                  name: `${u.name} (${u.email})`,
                  value: u.id,
                  disabled: u.id === currentAssignee?.id
                }))
              ];
              const assigneeAnswer = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'assignee',
                  message: 'New assignee:',
                  choices: assigneeChoices
                }
              ]);
              updatePayload.assigneeId = assigneeAnswer.assignee;
              break;
            }

            case 'priority': {
              const priorityAnswer = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'priority',
                  message: 'New priority:',
                  choices: [
                    { name: '🔴 Urgent', value: 1 },
                    { name: '🟠 High', value: 2 },
                    { name: '🟡 Medium', value: 3 },
                    { name: '🔵 Low', value: 4 },
                    { name: '⚪ None', value: 0 }
                  ],
                  default: issue.priority || 0
                }
              ]);
              updatePayload.priority = priorityAnswer.priority;
              break;
            }
          }
        }

        // Validate and update the issue
        const validPayload = linearIssueUpdatePayloadSchema.parse(updatePayload);

        console.log(chalk.dim(`Updating issue in account: ${account?.name || 'unknown'}...`));
        await client.updateIssue(issue.id, validPayload);

        logSuccess(`Issue ${issue.identifier} updated successfully!`);
        console.log(chalk.dim(`🔗 ${issue.url}`));
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          logError('Error updating issue', error);
        }
      }
    });
}
