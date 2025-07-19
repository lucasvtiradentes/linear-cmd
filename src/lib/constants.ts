import * as os from 'os';
import * as path from 'path';

export const APP_INFO = {
  name: 'linear-cli',
  display_name: 'Linear CLI',
  version: '1.0.0',
  schema_url: 'https://raw.githubusercontent.com/lucasvtiradentes/linear-cli/main/schema.json'
};

export type SupportedOS = 'linux' | 'mac' | 'windows' | 'wsl';

export function getUserOS(): SupportedOS {
  const platform = os.platform();
  
  if (platform === 'linux') {
    // Check if running in WSL
    try {
      const release = os.release().toLowerCase();
      if (release.includes('microsoft') || release.includes('wsl')) {
        return 'wsl';
      }
    } catch {
      // Ignore error and fallback to linux
    }
    return 'linux';
  }
  
  if (platform === 'darwin') return 'mac';
  if (platform === 'win32') return 'windows';
  
  throw new Error(`Unsupported OS: ${platform}`);
}

export function getConfigDirectory(): string {
  const userOS = getUserOS();
  const homeDir = os.homedir();
  
  switch (userOS) {
    case 'linux':
    case 'wsl':
      return path.join(homeDir, '.config', APP_INFO.name);
    case 'mac':
      return path.join(homeDir, 'Library', 'Preferences', APP_INFO.name);
    case 'windows':
      return path.join(homeDir, 'AppData', 'Roaming', APP_INFO.name);
    default:
      throw new Error(`Unsupported OS: ${userOS}`);
  }
}

export const CONFIG_PATHS = {
  configDir: getConfigDirectory(),
  userMetadataFile: path.join(getConfigDirectory(), 'user_metadata.json'),
  defaultConfigFile: path.join(getConfigDirectory(), 'config.json5'),
  schemaUrl: APP_INFO.schema_url,
};

export const SUPPORTED_OS: SupportedOS[] = ['linux', 'mac', 'windows', 'wsl'];