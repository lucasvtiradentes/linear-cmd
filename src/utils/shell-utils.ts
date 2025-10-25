import { platform } from 'node:os';

export function isWindows(): boolean {
  return platform() === 'win32';
}

export function isMac(): boolean {
  return platform() === 'darwin';
}

export function isLinux(): boolean {
  return platform() === 'linux';
}

export function detectShell(): 'bash' | 'zsh' | null {
  if (isWindows()) {
    return null;
  }

  const currentShell = process.env.SHELL || '';

  if (currentShell.includes('zsh')) {
    return 'zsh';
  }

  if (currentShell.includes('bash')) {
    return 'bash';
  }

  return null;
}

export function getShellRestartCommand(shell: 'bash' | 'zsh' | null): string {
  if (shell === 'zsh') {
    return 'exec zsh';
  }
  if (shell === 'bash') {
    return 'exec bash';
  }
  return 'Restart your shell or terminal';
}
