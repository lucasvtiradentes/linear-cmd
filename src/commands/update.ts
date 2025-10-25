import { Command } from 'commander';

import { APP_INFO } from '../constants.js';
import { ConfigManager } from '../lib/config-manager.js';
import { logger } from '../lib/logger.js';
import { CommandNames } from '../schemas/definitions.js';
import { createCommandFromSchema } from '../schemas/utils.js';
import { execAsync } from '../utils/cli-utils.js';
import { detectShell, getShellRestartCommand, isWindows } from '../utils/shell-utils.js';
import { reinstallCompletionSilently } from './completion/index.js';

export function createUpdateCommand(): Command {
  return createCommandFromSchema(CommandNames.UPDATE).action(async () => {
    try {
      logger.loading('Checking current version...');

      const currentVersion = APP_INFO.version;

      logger.loading('Checking latest version...');

      const latestVersion = await getLatestVersion();
      if (!latestVersion) {
        logger.error('Could not fetch latest version from npm');
        return;
      }

      logger.info(`📦 Current version: ${currentVersion}`);
      logger.info(`📦 Latest version: ${latestVersion}`);

      if (currentVersion === latestVersion) {
        logger.success(`✅ ${APP_INFO.name} is already up to date!`);
        return;
      }

      logger.loading('Detecting package manager...');

      const packageManager = await detectPackageManager();

      if (!packageManager) {
        logger.error(`Could not detect how ${APP_INFO.name} was installed`);
        logger.dim('Please update manually using your package manager');
        return;
      }

      logger.info(`📦 Detected package manager: ${packageManager}`);
      logger.loading(`Updating ${APP_INFO.name} from ${currentVersion} to ${latestVersion}...`);

      const updateCommand = getUpdateCommand(packageManager);
      const { stdout, stderr } = await execAsync(updateCommand);

      if (stderr && !stderr.includes('npm WARN')) {
        logger.error(`Error updating: ${stderr}`);
        return;
      }

      logger.success(`✅ ${APP_INFO.name} updated successfully from ${currentVersion} to ${latestVersion}!`);

      if (stdout) {
        logger.dim(stdout);
      }

      if (!isWindows()) {
        const configManager = new ConfigManager();

        const completionReinstalled = await reinstallCompletionSilently(configManager.isCompletionInstalled());
        if (completionReinstalled) {
          const shell = detectShell();

          logger.info('');
          logger.success('✨ Shell completion updated');
          logger.info('');
          logger.warning('⚠️  To apply completion changes, run:');

          const command = getShellRestartCommand(shell);
          if (command.includes('exec')) {
            logger.info(`  ${command}`);
            logger.info('');
            logger.dim('  Or restart your terminal');
          } else {
            logger.info(`  ${command}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error updating:', error);
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

    try {
      if (isMac()) {
        const { stdout: linkedPath } = await execAsync(`readlink "${execPath}"`);
        if (linkedPath.trim()) {
          return linkedPath.trim();
        }
      } else if (!isWindows()) {
        const { stdout: realPath } = await execAsync(`readlink -f "${execPath}"`);
        return realPath.trim() || execPath;
      }
    } catch {}

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
