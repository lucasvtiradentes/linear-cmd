#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';

import { createAccountCommand } from './commands/account/index';
import { createIssueCommand } from './commands/issue/index';

const program = new Command();

program.name('linear').description('Linear CLI - A GitHub CLI-like tool for Linear').version('1.0.0');

// Add commands
program.addCommand(createAccountCommand());
program.addCommand(createIssueCommand());

// Global help improvements
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name()
});

// Custom help
program.on('--help', () => {
  console.log('');
  console.log(chalk.bold('Examples:'));
  console.log('  $ linear account add                     # Add a new account');
  console.log('  $ linear account list                    # List all accounts');
  console.log('  $ linear account switch work             # Switch to work account');
  console.log('  $ linear issue show WAY-123              # Show issue by ID');
  console.log('  $ linear issue show <linear-url>         # Show issue by URL');
  console.log('  $ linear issue branch WAY-123            # Get branch name for issue');
  console.log('');
  console.log(chalk.bold('Getting Started:'));
  console.log('  1. Get your API key from Linear Settings > Account > API');
  console.log('  2. Run: linear account add');
  console.log('  3. Test connection: linear account test');
  console.log('  4. View an issue: linear issue show <issue-id-or-url>');
  console.log('');
  console.log(chalk.dim('For more information, visit: https://linear.app/developers'));
});

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
