import {
  accessSync,
  constants,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { colors } from '../../lib/colors.js';
import { logger } from '../../lib/logger.js';
import { generateBashCompletion, generateZshCompletion } from '../../schemas/generators/completion-generator.js';
import { detectShell as detectShellUtil, isWindows } from '../../utils/shell-utils.js';

const ZSH_COMPLETION_SCRIPT = generateZshCompletion();
const BASH_COMPLETION_SCRIPT = generateBashCompletion();

function findFirstWritableDir(possibleDirs: string[]): string | null {
  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      try {
        accessSync(dir, constants.W_OK);
        return dir;
      } catch {}
    }
  }
  return null;
}

export async function clearZshCompletionCache(): Promise<void> {
  const homeDir = homedir();

  try {
    const files = readdirSync(homeDir);
    for (const file of files) {
      if (file.startsWith('.zcompdump')) {
        const fullPath = join(homeDir, file);
        try {
          unlinkSync(fullPath);
        } catch {}
      }
    }

    const cacheDirs = [join(homeDir, '.zsh_cache'), join(homeDir, '.cache', 'zsh'), join(homeDir, '.zcompcache')];

    for (const cacheDir of cacheDirs) {
      if (existsSync(cacheDir)) {
        try {
          const cacheFiles = readdirSync(cacheDir);
          for (const file of cacheFiles) {
            if (file.includes('compdump') || file.includes('_linear')) {
              try {
                unlinkSync(join(cacheDir, file));
              } catch {}
            }
          }
        } catch {}
      }
    }
  } catch {}
}

export async function installZshCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = isWindows()
    ? [join(homeDir, '.zsh', 'completions'), join(homeDir, '.config', 'zsh', 'completions')]
    : [
        join(homeDir, '.oh-my-zsh', 'completions'),
        join(homeDir, '.zsh', 'completions'),
        join(homeDir, '.config', 'zsh', 'completions'),
        join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
        '/usr/local/share/zsh/site-functions'
      ];

  let targetDir = findFirstWritableDir(possibleDirs);

  if (!targetDir) {
    targetDir = join(homeDir, '.zsh', 'completions');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, '_linear');
  writeFileSync(completionFile, ZSH_COMPLETION_SCRIPT);

  if (!silent) {
    logger.success(`✅ Zsh completion installed to ${completionFile}`);
    logger.info('');
    logger.info('To activate completion, add this to your ~/.zshrc:');
    logger.info(colors.cyan(`  fpath=(${targetDir} $fpath)`));
    logger.info(colors.cyan('  autoload -U compinit && compinit'));
    logger.info('');
    logger.info('Then restart your shell or run:');
    logger.info(colors.cyan('  source ~/.zshrc'));

    try {
      const zshrc = join(homeDir, '.zshrc');
      if (existsSync(zshrc)) {
        const zshrcContent = readFileSync(zshrc, 'utf8');
        if (!zshrcContent.includes(targetDir)) {
          logger.info('');
          logger.warning('⚠️  Remember to add the fpath line to your ~/.zshrc for autocompletion to work!');
        }
      }
    } catch {}
  }
}

export async function installBashCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = isWindows()
    ? [join(homeDir, '.bash_completion.d'), join(homeDir, '.local', 'share', 'bash-completion', 'completions')]
    : [
        join(homeDir, '.bash_completion.d'),
        join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
        '/usr/local/etc/bash_completion.d',
        '/etc/bash_completion.d'
      ];

  let targetDir = findFirstWritableDir(possibleDirs);

  if (!targetDir) {
    targetDir = join(homeDir, '.bash_completion.d');
    mkdirSync(targetDir, { recursive: true });
  }

  const completionFile = join(targetDir, 'linear');
  writeFileSync(completionFile, BASH_COMPLETION_SCRIPT);

  if (!silent) {
    logger.success(`✅ Bash completion installed to ${completionFile}`);
    logger.info('');
    logger.info('To activate completion, add this to your ~/.bashrc:');
    logger.info(colors.cyan(`  source ${completionFile}`));
    logger.info('');
    logger.info('Then restart your shell or run:');
    logger.info(colors.cyan('  source ~/.bashrc'));
  }
}

export async function uninstallZshCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = isWindows()
    ? [join(homeDir, '.zsh', 'completions'), join(homeDir, '.config', 'zsh', 'completions')]
    : [
        join(homeDir, '.oh-my-zsh', 'completions'),
        join(homeDir, '.zsh', 'completions'),
        join(homeDir, '.config', 'zsh', 'completions'),
        join(homeDir, '.local', 'share', 'zsh', 'site-functions'),
        '/usr/local/share/zsh/site-functions'
      ];

  let foundFiles = 0;

  for (const dir of possibleDirs) {
    const completionFile = join(dir, '_linear');
    if (existsSync(completionFile)) {
      try {
        unlinkSync(completionFile);
        foundFiles++;
        if (!silent) {
          logger.success(`✅ Removed completion file: ${completionFile}`);
        }
      } catch (error) {
        if (!silent) {
          logger.warning(`⚠️  Could not remove ${completionFile}: ${error}`);
        }
      }
    }
  }

  await clearZshCompletionCache();

  if (!silent) {
    if (foundFiles === 0) {
      logger.warning('⚠️  No completion files found');
    } else {
      logger.info('');
      logger.success('✅ Zsh completion uninstalled successfully');
      logger.info('');
      logger.info('Restart your shell or run:');
      logger.info(colors.cyan('  source ~/.zshrc'));
    }
  }
}

export async function uninstallBashCompletion(silent = false): Promise<void> {
  const homeDir = homedir();

  const possibleDirs = isWindows()
    ? [join(homeDir, '.bash_completion.d'), join(homeDir, '.local', 'share', 'bash-completion', 'completions')]
    : [
        join(homeDir, '.bash_completion.d'),
        join(homeDir, '.local', 'share', 'bash-completion', 'completions'),
        '/usr/local/etc/bash_completion.d',
        '/etc/bash_completion.d'
      ];

  let foundFiles = 0;

  for (const dir of possibleDirs) {
    const completionFile = join(dir, 'linear');
    if (existsSync(completionFile)) {
      try {
        unlinkSync(completionFile);
        foundFiles++;
        if (!silent) {
          logger.success(`✅ Removed completion file: ${completionFile}`);
        }
      } catch (error) {
        if (!silent) {
          logger.warning(`⚠️  Could not remove ${completionFile}: ${error}`);
        }
      }
    }
  }

  if (!silent) {
    if (foundFiles === 0) {
      logger.warning('⚠️  No completion files found');
    } else {
      logger.info('');
      logger.success('✅ Bash completion uninstalled successfully');
      logger.info('');
      logger.info('Restart your shell or run:');
      logger.info(colors.cyan('  source ~/.bashrc'));
    }
  }
}

export function detectShell(): string | null {
  return detectShellUtil();
}

export async function reinstallCompletionSilently(isInstalled: boolean): Promise<boolean> {
  if (!isInstalled) {
    return false;
  }

  const shell = detectShellUtil();

  try {
    switch (shell) {
      case 'zsh':
        await installZshCompletion(true);
        await clearZshCompletionCache();
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
