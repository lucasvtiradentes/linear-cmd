#!/usr/bin/env node

import { Command } from 'commander';

import { createAccountCommand } from './commands/account/index.js';
import { createCompletionCommand } from './commands/completion.js';
import { createDocumentCommand } from './commands/document/index.js';
import { createIssueCommand } from './commands/issue/index.js';
import { createProjectCommand } from './commands/project/index.js';
import { createUpdateCommand } from './commands/update.js';
import { APP_INFO } from './constants.js';
import { Logger } from './lib/logger.js';

const program = new Command();

program.name('linear').description('Linear CLI - A GitHub CLI-like tool for Linear').version(APP_INFO.version);

// Add commands
program.addCommand(createAccountCommand());
program.addCommand(createIssueCommand());
program.addCommand(createProjectCommand());
program.addCommand(createDocumentCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createCompletionCommand());

// Global help improvements
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name()
});

// Show detailed help on --help
program.on('--help', () => {
  Logger.plain('');
  Logger.bold('Examples:');
  Logger.plain('  $ linear account add                     # Add a new account');
  Logger.plain('  $ linear account list                    # List all accounts');
  Logger.plain('  $ linear account test                    # Test all accounts');
  Logger.plain('  $ linear issue show WORK-123             # Show issue by ID');
  Logger.plain('  $ linear issue show <linear-url>         # Show issue by URL');
  Logger.plain('  $ linear issue list -a work              # List all issues grouped by status');
  Logger.plain('  $ linear issue list -a work --assignee me  # List my issues');
  Logger.plain('  $ linear issue list -a work --team TES   # Filter by team');
  Logger.plain('  $ linear issue create -a work            # Create new issue (interactive)');
  Logger.plain('  $ linear issue update WORK-123           # Update issue (interactive)');
  Logger.plain('  $ linear issue comment WORK-123          # Add comment (interactive)');
  Logger.plain('  $ linear project show <project-url>      # Show project details');
  Logger.plain('  $ linear project issues <project-url>    # List project issues');
  Logger.plain('  $ linear document show <document-url>    # Show document content');
  Logger.plain('  $ linear update                          # Update linear-cmd to latest version');
  Logger.plain('  $ linear completion install              # Install shell completion');
  Logger.plain('');
  Logger.bold('Getting Started:');
  Logger.plain('  1. Get your API key from Linear Settings > Account > API');
  Logger.plain('  2. Run: linear account add');
  Logger.plain('  3. Test connection: linear account test');
  Logger.plain('  4. List your issues: linear issue list -a <account-name> --assignee me');
  Logger.plain('');
  Logger.dim('For more information, visit: https://linear.app/developers');
});

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
