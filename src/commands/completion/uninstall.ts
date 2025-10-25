import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { logger } from '../../lib/logger.js';
import { detectShell, uninstallBashCompletion, uninstallZshCompletion } from './utils.js';

export function createCompletionUninstallCommand(): Command {
  return new Command('uninstall').description('Uninstall shell completion').action(async () => {
    const shell = detectShell();
    const configManager = new ConfigManager();

    if (!shell) {
      logger.error('❌ Could not detect shell');
      logger.info('');
      logger.info('🐚 Supported shells: zsh, bash');
      process.exit(1);
    }

    try {
      switch (shell) {
        case 'zsh':
          await uninstallZshCompletion();
          break;
        case 'bash':
          await uninstallBashCompletion();
          break;
        default:
          logger.error(`❌ Unsupported shell: ${shell}`);
          logger.info('');
          logger.info('🐚 Supported shells: zsh, bash');
          process.exit(1);
      }

      configManager.markCompletionUninstalled();
    } catch (error) {
      logger.error(`Failed to uninstall completion: ${error}`);
      process.exit(1);
    }
  });
}
