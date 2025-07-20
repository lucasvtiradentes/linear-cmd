import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';

import { ConfigManager } from '../../lib/config-manager.js';
import { parseIssueIdentifier } from '../../lib/issue-utils.js';

export function createCommentIssueCommand(): Command {
  return new Command('comment')
    .description('Add a comment to a Linear issue')
    .argument('<issue>', 'issue ID or URL')
    .argument('[comment]', 'comment text (optional, will prompt if not provided)')
    .option('-a, --account <account>', 'specify account to use')
    .option('--edit', 'open editor for comment')
    .action(async (issueIdOrUrl, commentText, options) => {
      const configManager = new ConfigManager();

      try {
        // Parse issue identifier first
        const issueId = parseIssueIdentifier(issueIdOrUrl);
        if (!issueId) {
          console.error(chalk.red('❌ Invalid issue ID or URL'));
          return;
        }

        // For comment, we'll try to find the account that has access to this issue
        // if not specified
        let client;

        if (options.account) {
          const account = configManager.getAccount(options.account);
          if (!account) {
            console.error(chalk.red(`❌ Account '${options.account}' not found`));
            console.log(chalk.dim('Run `linear account list` to see available accounts'));
            return;
          }
          client = new LinearClient({ apiKey: account.api_key });
        } else {
          // Try to find which account can access this issue
          const accounts = await configManager.getLegacyAccounts();
          let foundAccount = null;

          for (const acc of accounts) {
            try {
              const testClient = new LinearClient({ apiKey: acc.apiKey });
              await testClient.issue(issueId);
              foundAccount = acc;
              client = testClient;
              break;
            } catch {
              // This account can't access the issue, try next
            }
          }

          if (!foundAccount || !client) {
            console.error(chalk.red('❌ Could not find an account with access to this issue'));
            console.log(chalk.dim('Use --account flag to specify which account to use'));
            console.log(chalk.dim('Run `linear account list` to see available accounts'));
            return;
          }
        }

        // Fetch the issue
        const issue = await client.issue(issueId);
        if (!issue) {
          console.error(chalk.red(`❌ Issue ${issueId} not found`));
          return;
        }

        // Get comment text
        let comment = commentText;

        if (!comment || options.edit) {
          const answers = await inquirer.prompt([
            {
              type: options.edit ? 'editor' : 'input',
              name: 'comment',
              message: 'Comment:',
              validate: (input: string) => input.trim().length > 0 || 'Comment cannot be empty'
            }
          ]);
          comment = answers.comment;
        }

        // Add the comment
        console.log(chalk.dim('Adding comment...'));

        await client.createComment({
          issueId: issue.id,
          body: comment
        });

        console.log(chalk.green(`✅ Comment added to ${issue.identifier}`));
        console.log(chalk.dim(`🔗 ${issue.url}`));

        // Show recent comments
        const comments = await issue.comments({ last: 3 });
        if (comments.nodes.length > 0) {
          console.log(chalk.dim('\nRecent comments:'));
          for (const c of comments.nodes.reverse()) {
            const author = await c.user;
            const createdAt = new Date(c.createdAt);
            const timeAgo = getRelativeTime(createdAt);

            console.log(chalk.blue(`\n💬 ${author?.name || 'Unknown'} • ${timeAgo}`));
            console.log(c.body);
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error adding comment: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
