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

export function detectShell(): 'bash' | 'zsh' | 'powershell' | 'cmd' | null {
  if (isWindows()) {
    const comspec = process.env.COMSPEC || '';
    const psModulePath = process.env.PSModulePath || '';

    if (psModulePath) {
      return 'powershell';
    }
    if (comspec.includes('cmd.exe')) {
      return 'cmd';
    }
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

export function getShellRestartCommand(shell: 'bash' | 'zsh' | 'powershell' | 'cmd' | null): string {
  if (shell === 'zsh') {
    return 'exec zsh';
  }
  if (shell === 'bash') {
    return 'exec bash';
  }
  if (shell === 'powershell') {
    return '& $PROFILE';
  }
  if (shell === 'cmd') {
    return 'Restart your terminal';
  }
  return 'Restart your shell or terminal';
}
