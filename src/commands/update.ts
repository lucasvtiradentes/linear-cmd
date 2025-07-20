import chalk from 'chalk';
import { Command } from 'commander';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

export function createUpdateCommand(): Command {
  return new Command('update')
    .description('Update the linear-cmd package to the latest version')
    .action(async () => {
      try {
        console.log(chalk.dim('Detecting package manager...'));
        
        const packageManager = await detectPackageManager();
        
        if (!packageManager) {
          console.error(chalk.red('❌ Could not detect how linear-cmd was installed'));
          console.log(chalk.dim('Please update manually using your package manager'));
          return;
        }

        console.log(chalk.blue(`📦 Detected package manager: ${packageManager}`));
        console.log(chalk.dim('Updating linear-cmd...'));

        const updateCommand = getUpdateCommand(packageManager);
        const { stdout, stderr } = await execAsync(updateCommand);

        if (stderr && !stderr.includes('npm WARN')) {
          console.error(chalk.red(`❌ Error updating: ${stderr}`));
          return;
        }

        console.log(chalk.green('✅ linear-cmd updated successfully!'));
        
        if (stdout) {
          console.log(chalk.dim(stdout));
        }
      } catch (error) {
        console.error(chalk.red(`❌ Error updating: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}

async function detectPackageManager(): Promise<string | null> {
  const isWindows = platform() === 'win32';
  const npmPath = await getGlobalNpmPath();
  
  if (!npmPath) {
    return null;
  }

  const possiblePaths = [
    { manager: 'npm', patterns: ['/npm/', '\\npm\\', '/node/', '\\node\\'] },
    { manager: 'yarn', patterns: ['/yarn/', '\\yarn\\', '/.yarn/', '\\.yarn\\'] },
    { manager: 'pnpm', patterns: ['/pnpm/', '\\pnpm\\', '/.pnpm/', '\\.pnpm\\'] }
  ];

  for (const { manager, patterns } of possiblePaths) {
    if (patterns.some(pattern => npmPath.includes(pattern))) {
      return manager;
    }
  }

  // Default to npm if we can't determine
  return 'npm';
}

async function getGlobalNpmPath(): Promise<string | null> {
  const isWindows = platform() === 'win32';
  
  try {
    // Try to find the linear-cmd executable
    const whereCommand = isWindows ? 'where' : 'which';
    const { stdout } = await execAsync(`${whereCommand} linear-cmd`);
    const execPath = stdout.trim();
    
    if (execPath) {
      // On Unix systems, this might be a symlink, so resolve it
      if (!isWindows) {
        try {
          const { stdout: realPath } = await execAsync(`readlink -f "${execPath}"`);
          return realPath.trim() || execPath;
        } catch {
          return execPath;
        }
      }
      return execPath;
    }
  } catch {
    // If which/where fails, try npm list
    try {
      const { stdout } = await execAsync('npm list -g --depth=0 linear-cmd');
      if (stdout.includes('linear-cmd')) {
        return 'npm';
      }
    } catch {
      // Continue to other methods
    }
  }
  
  return null;
}

function getUpdateCommand(packageManager: string): string {
  switch (packageManager) {
    case 'npm':
      return 'npm update -g linear-cmd';
    case 'yarn':
      return 'yarn global upgrade linear-cmd';
    case 'pnpm':
      return 'pnpm update -g linear-cmd';
    default:
      return 'npm update -g linear-cmd';
  }
}