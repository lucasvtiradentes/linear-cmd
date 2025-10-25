import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';
import { detectShell, installBashCompletion, installZshCompletion } from './utils.js';

export function createCompletionInstallCommand(): Command {
  return new Command('install').description('Install shell completion for your current shell').action(async () => {
    const shell = detectShell();
    const configManager = new ConfigManager();

    if (!shell) {
      Logger.error('❌ Could not detect shell');
      Logger.info('');
      Logger.info('🐚 Supported shells: zsh, bash');
      Logger.info('💡 Set SHELL environment variable or run from bash/zsh');
      process.exit(1);
    }

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

      configManager.markCompletionInstalled();
    } catch (error) {
      Logger.error(`Failed to install completion: ${error}`);
      process.exit(1);
    }
  });
}
