import { Command } from 'commander';

import { APP_INFO } from '../constants.js';
import { Logger } from '../lib/logger.js';
import { CommandNames } from '../schemas/definitions.js';
import { createCommandFromSchema } from '../schemas/utils.js';
import { execAsync } from '../utils/cli-utils.js';
import { detectShell, getShellRestartCommand, isWindows } from '../utils/shell-utils.js';
import { reinstallCompletionSilently } from './completion/index.js';

export function createUpdateCommand(): Command {
  return createCommandFromSchema(CommandNames.UPDATE).action(async () => {
    try {
      Logger.loading('Checking current version...');

      const currentVersion = APP_INFO.version;

      Logger.loading('Checking latest version...');

      const latestVersion = await getLatestVersion();
      if (!latestVersion) {
        Logger.error('Could not fetch latest version from npm');
        return;
      }

      Logger.info(`📦 Current version: ${currentVersion}`);
      Logger.info(`📦 Latest version: ${latestVersion}`);

      if (currentVersion === latestVersion) {
        Logger.success(`✅ ${APP_INFO.name} is already up to date!`);
        return;
      }

      Logger.loading('Detecting package manager...');

      const packageManager = await detectPackageManager();

      if (!packageManager) {
        Logger.error(`Could not detect how ${APP_INFO.name} was installed`);
        Logger.dim('Please update manually using your package manager');
        return;
      }

      Logger.info(`📦 Detected package manager: ${packageManager}`);
      Logger.loading(`Updating ${APP_INFO.name} from ${currentVersion} to ${latestVersion}...`);

      const updateCommand = getUpdateCommand(packageManager);
      const { stdout, stderr } = await execAsync(updateCommand);

      if (stderr && !stderr.includes('npm WARN')) {
        Logger.error(`Error updating: ${stderr}`);
        return;
      }

      Logger.success(`✅ ${APP_INFO.name} updated successfully from ${currentVersion} to ${latestVersion}!`);

      if (stdout) {
        Logger.dim(stdout);
      }

      if (!isWindows()) {
        const { ConfigManager } = await import('../lib/config-manager.js');
        const configManager = new ConfigManager();

        const completionReinstalled = await reinstallCompletionSilently(configManager.isCompletionInstalled());
        if (completionReinstalled) {
          const shell = detectShell();

          Logger.info('');
          Logger.success('✨ Shell completion updated');
          Logger.info('');
          Logger.warning('⚠️  To apply completion changes, run:');

          const command = getShellRestartCommand(shell);
          if (command.includes('exec')) {
            Logger.info(`  ${command}`);
            Logger.info('');
            Logger.dim('  Or restart your terminal');
          } else {
            Logger.info(`  ${command}`);
          }
        }
      }
    } catch (error) {
      Logger.error('Error updating:', error);
    }
  });
}

async function detectPackageManager(): Promise<string | null> {
  const execPath = await getExecutablePath();
  if (execPath) {
    const manager = detectManagerFromPath(execPath);
    if (manager) {
      return manager;
    }
  }

  const nullRedirect = isWindows() ? '2>nul' : '2>/dev/null';

  const npmCheckCmd = `npm list -g --depth=0 ${APP_INFO.name} ${nullRedirect}`;
  try {
    const { stdout } = await execAsync(npmCheckCmd);
    if (stdout.includes(APP_INFO.name)) {
      return 'npm';
    }
  } catch {}

  const managers = ['pnpm', 'yarn'];
  for (const manager of managers) {
    const checkCmd = `${manager} list -g ${APP_INFO.name} ${nullRedirect}`;
    try {
      const { stdout } = await execAsync(checkCmd);
      if (stdout.includes(APP_INFO.name)) {
        return manager;
      }
    } catch {}
  }

  return null;
}

async function getExecutablePath(): Promise<string | null> {
  try {
    const whereCommand = isWindows() ? 'where' : 'which';
    const { stdout } = await execAsync(`${whereCommand} ${APP_INFO.name}`);

    const execPath = stdout.trim().split('\n')[0].trim();

    if (!execPath) {
      return null;
    }

    if (!isWindows()) {
      try {
        if (isMac()) {
          try {
            const { stdout: linkedPath } = await execAsync(`readlink "${execPath}"`);
            if (linkedPath.trim()) {
              return linkedPath.trim();
            }
          } catch {
            return execPath;
          }
        } else {
          const { stdout: realPath } = await execAsync(`readlink -f "${execPath}"`);
          return realPath.trim() || execPath;
        }
      } catch {
        return execPath;
      }
    }

    return execPath;
  } catch {
    return null;
  }
}

function detectManagerFromPath(path: string): string | null {
  const normalizedPath = path.replace(/\\/g, '/').toLowerCase();

  const patterns = [
    { manager: 'pnpm', patterns: ['/pnpm/', '/.pnpm/'] },
    { manager: 'yarn', patterns: ['/yarn/', '/.yarn/'] },
    { manager: 'npm', patterns: ['/npm/', '/node_modules/', '/node/'] }
  ];

  for (const { manager, patterns: managerPatterns } of patterns) {
    if (managerPatterns.some((pattern) => normalizedPath.includes(pattern))) {
      return manager;
    }
  }

  return 'npm';
}

async function getLatestVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`npm view ${APP_INFO.name} version`);
    return stdout.trim();
  } catch {
    return null;
  }
}

function getUpdateCommand(packageManager: string): string {
  switch (packageManager) {
    case 'npm':
      return `npm update -g ${APP_INFO.name}`;
    case 'yarn':
      return `yarn global upgrade ${APP_INFO.name}`;
    case 'pnpm':
      return `pnpm update -g ${APP_INFO.name}`;
    default:
      return `npm update -g ${APP_INFO.name}`;
  }
}

function isMac(): boolean {
  return process.platform === 'darwin';
}
