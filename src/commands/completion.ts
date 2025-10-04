import { accessSync, constants, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';

import { ConfigManager } from '../lib/config-manager.js';
import { Logger } from '../lib/logger.js';

const ZSH_COMPLETION_SCRIPT = `#compdef linear

_linear() {
    local state line context
    typeset -A opt_args

    _arguments -C \
        '1: :_linear_commands' \
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                account)
                    _linear_account
                    ;;
                issue)
                    _linear_issue
                    ;;
                project)
                    _linear_project
                    ;;
                document)
                    _linear_document
                    ;;
                update)
                    # No subcommands for update
                    ;;
            esac
            ;;
    esac
}

_linear_commands() {
    local commands
    commands=(
        'account:Manage Linear accounts'
        'issue:Manage Linear issues'
        'project:Manage Linear projects'
        'document:Manage Linear documents'
        'update:Update linear-cmd to latest version'
        'completion:Generate shell completion scripts'
    )
    _describe 'command' commands
}

_linear_account() {
    local account_commands
    account_commands=(
        'add:Add a new Linear account'
        'list:List all configured accounts'
        'remove:Remove an account'
        'test:Test connection of all accounts'
    )
    _describe 'account command' account_commands
}

_linear_issue() {
    local issue_commands
    issue_commands=(
        'show:Show details of an issue'
        'create:Create a new issue'
        'list:List all issues grouped by status'
        'update:Update an issue'
        'comment:Add a comment to an issue'
    )
    _describe 'issue command' issue_commands
}

_linear_project() {
    local project_commands
    project_commands=(
        'show:Show details of a project'
        'issues:List all issues in a project'
    )
    _describe 'project command' project_commands
}

_linear_document() {
    local document_commands
    document_commands=(
        'show:Show details of a document'
    )
    _describe 'document command' document_commands
}

_linear "$@"
`;

const BASH_COMPLETION_SCRIPT = `#!/bin/bash

_linear_completion() {
    local cur prev words cword
    _init_completion || return

    # Main commands
    local commands="account issue project document update completion"

    # Account subcommands
    local account_commands="add list remove test"

    # Issue subcommands
    local issue_commands="show create list update comment"

    # Project subcommands
    local project_commands="show issues"

    # Document subcommands
    local document_commands="show"

    if [[ \$cword -eq 1 ]]; then
        COMPREPLY=(\$(compgen -W "\$commands" -- "\$cur"))
    elif [[ \$cword -eq 2 ]]; then
        case "\${COMP_WORDS[1]}" in
            account)
                COMPREPLY=(\$(compgen -W "\$account_commands" -- "\$cur"))
                ;;
            issue)
                COMPREPLY=(\$(compgen -W "\$issue_commands" -- "\$cur"))
                ;;
            project)
                COMPREPLY=(\$(compgen -W "\$project_commands" -- "\$cur"))
                ;;
            document)
                COMPREPLY=(\$(compgen -W "\$document_commands" -- "\$cur"))
                ;;
            completion)
                COMPREPLY=(\$(compgen -W "install" -- "\$cur"))
                ;;
        esac
    fi
}

complete -F _linear_completion linear
complete -F _linear_completion lin
`;

export function createCompletionCommand(): Command {
  const completion = new Command('completion');
  completion.description('Generate shell completion scripts');

  completion
    .command('install')
    .description('Install shell completion for your current shell')
    .action(async () => {
      const shell = detectShell();
      const configManager = new ConfigManager();

      try {
        switch (shell) {
          case 'zsh':
            await installZshCompletion();
            break;
          case 'bash':
            await installBashCompletion();
            break;
          default:
            Logger.error(`❌ Unsupported shell: ${shell}`);
            Logger.info('');
            Logger.info('🐚 Supported shells: zsh, bash');
            Logger.info('💡 Please switch to a supported shell to use autocompletion');
            process.exit(1);
        }

        // Mark completion as installed in config
        configManager.markCompletionInstalled();
      } catch (error) {
        Logger.error(`Failed to install completion: ${error}`);
        process.exit(1);
      }
    });

  return completion;
}

/**
 * Reinstall completion silently (used after update) - only if already installed
 */
export async function reinstallCompletionSilently(): Promise<boolean> {
  const configManager = new ConfigManager();

  // Only reinstall if user had previously installed completions
  if (!configManager.isCompletionInstalled()) {
    return false;
  }

  const shell = detectShell();

  try {
    switch (shell) {
      case 'zsh':
        await installZshCompletion(true);
        return true;
      case 'bash':
        await installBashCompletion(true);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function detectShell(): string {
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    return 'zsh';
  } else if (shell.includes('bash')) {
    return 'bash';
  }

  // Fallback to zsh if we can't detect
  return 'zsh';
}

async function installZshCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  // Try different zsh completion directories (prioritize user directories)
  const possibleDirs = [
    join(homeDir, '.oh-my-zsh', 'completions'),
    join(homeDir, '.zsh', 'completions'),
    join(homeDir, '.config', 'zsh', 'completions'),
    join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
    '/usr/local/share/zsh/site-functions'
  ];

  let targetDir: string | null = null;

  // Find the first existing and writable directory
  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        // Check if we can write to this directory
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  // If no existing directory found, create one in user's home
  if (!targetDir) {
    targetDir = join(homeDir, '.zsh', 'completions');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, '_linear');
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);

  if (!silent) {
    Logger.success(`✅ Zsh completion installed to ${completionFile}`);
    Logger.info('');
    Logger.info('To activate completion, add this to your ~/.zshrc:');
    Logger.info(chalk.cyan(`  fpath=(${targetDir} $fpath)`));
    Logger.info(chalk.cyan('  autoload -U compinit && compinit'));
    Logger.info('');
    Logger.info('Then restart your shell or run:');
    Logger.info(chalk.cyan('  source ~/.zshrc'));

    // Check if fpath already includes the directory
    try {
      const zshrc = join(homeDir, '.zshrc');
      if (existsSync(zshrc)) {
        const zshrcContent = require('fs').readFileSync(zshrc, 'utf8');
        if (!zshrcContent.includes(targetDir)) {
          Logger.info('');
          Logger.warning('⚠️  Remember to add the fpath line to your ~/.zshrc for autocompletion to work!');
        }
      }
    } catch (_error) {
      // Ignore errors when checking .zshrc
    }
  }
}

async function installBashCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  // Try different bash completion directories (prioritize user directories)
  const possibleDirs = [
    join(homeDir, '.bash_completion.d'),
    join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
    '/usr/local/etc/bash_completion.d',
    '/etc/bash_completion.d'
  ];

  let targetDir: string | null = null;

  // Find the first existing and writable directory
  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        // Check if we can write to this directory
        accessSync(dir, constants.W_OK);
        targetDir = dir;
        break;
      } catch {}
    }
  }

  // If no existing directory found, create one in user's home
  if (!targetDir) {
    targetDir = join(homeDir, '.bash_completion.d');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, 'linear');
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);

  if (!silent) {
    Logger.success(`✅ Bash completion installed to ${completionFile}`);
    Logger.info('');
    Logger.info('To activate completion, add this to your ~/.bashrc:');
    Logger.info(chalk.cyan(`  source ${completionFile}`));
    Logger.info('');
    Logger.info('Then restart your shell or run:');
    Logger.info(chalk.cyan('  source ~/.bashrc'));
  }
}
