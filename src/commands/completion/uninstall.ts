import { Command } from 'commander';

import { ConfigManager } from '../../lib/config-manager.js';
import { Logger } from '../../lib/logger.js';
import { detectShell, uninstallBashCompletion, uninstallZshCompletion } from './utils.js';

export function createCompletionUninstallCommand(): Command {
  return new Command('uninstall').description('Uninstall shell completion').action(async () => {
    const shell = detectShell();
    const configManager = new ConfigManager();

    if (!shell) {
      Logger.error('❌ Could not detect shell');
      Logger.info('');
      Logger.info('🐚 Supported shells: zsh, bash');
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
          Logger.error(`❌ Unsupported shell: ${shell}`);
          Logger.info('');
          Logger.info('🐚 Supported shells: zsh, bash');
          process.exit(1);
      }

      configManager.markCompletionUninstalled();
    } catch (error) {
      Logger.error(`Failed to uninstall completion: ${error}`);
      process.exit(1);
    }
  });
}
