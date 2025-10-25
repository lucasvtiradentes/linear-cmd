import { Command } from 'commander';

import { createCompletionInstallCommand } from './install.js';
import { createCompletionUninstallCommand } from './uninstall.js';

export function createCompletionCommand(): Command {
  const completion = new Command('completion');
  completion.description('Generate shell completion scripts');

  completion.addCommand(createCompletionInstallCommand());
  completion.addCommand(createCompletionUninstallCommand());

  return completion;
}

export { reinstallCompletionSilently } from './utils.js';
