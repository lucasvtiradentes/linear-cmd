import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { logger } from '../../lib/logger.js';
import { detectShell, installBashCompletion, installZshCompletion } from './utils.js';

export function createCompletionInstallCommand(): Command {
  return new Command('install').description('Install shell completion for your current shell').action(async () => {
    const shell = detectShell();
    const configManager = new ConfigManager();

    if (!shell) {
      logger.error('❌ Could not detect shell');
      logger.info('');
      logger.info('🐚 Supported shells: zsh, bash');
      logger.info('💡 Set SHELL environment variable or run from bash/zsh');
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
          logger.error(`❌ Unsupported shell: ${shell}`);
          logger.info('');
          logger.info('🐚 Supported shells: zsh, bash');
          logger.info('💡 Please switch to a supported shell to use autocompletion');
          process.exit(1);
      }

      configManager.markCompletionInstalled();
    } catch (error) {
      logger.error(`Failed to install completion: ${error}`);
      process.exit(1);
    }
  });
}
