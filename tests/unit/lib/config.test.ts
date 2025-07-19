import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ConfigManager, APP_NAME } from '../../../src/lib/config';

vi.mock('fs');
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/test'),
  platform: vi.fn(() => 'linux'),
  release: vi.fn(() => 'linux')
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockHomeDir = '/home/test';
  const mockConfigDir = path.join(mockHomeDir, '.config', APP_NAME);
  const mockUserMetadataFile = path.join(mockConfigDir, 'user_metadata.json');
  const mockConfigFile = path.join(mockConfigDir, 'config.json5');

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup filesystem mocks
    const mockFileSystem = new Map<string, string>();
    
    vi.mocked(fs.existsSync).mockImplementation((path: string) => mockFileSystem.has(path));
    vi.mocked(fs.readFileSync).mockImplementation((path: string) => {
      const content = mockFileSystem.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content;
    });
    vi.mocked(fs.writeFileSync).mockImplementation((path: string, content: string) => {
      mockFileSystem.set(path, content);
    });
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    
    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    it('should create config directory if it does not exist', () => {
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should initialize user metadata file', () => {
      const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const userMetadataCall = writeFileCalls.find(call => 
        call[0] === mockUserMetadataFile
      );
      expect(userMetadataCall).toBeDefined();
      expect(userMetadataCall![1]).toContain('config_path');
    });
  });

  describe('addAccount', () => {
    it('should add a new workspace', async () => {
      await configManager.addAccount('test', 'test-api-key');
      
      const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const configCall = writeFileCalls.find(call => 
        call[0] === mockConfigFile && 
        typeof call[1] === 'string' && 
        call[1].includes('test-api-key')
      );
      expect(configCall).toBeDefined();
    });

    it('should set first workspace as active', async () => {
      await configManager.addAccount('first', 'api-key-1');
      
      const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const metadataCall = writeFileCalls.find(call => 
        call[0] === mockUserMetadataFile && 
        typeof call[1] === 'string' && 
        call[1].includes('first')
      );
      expect(metadataCall).toBeDefined();
    });
  });

  describe('getActiveAccount', () => {
    it('should return null if no active workspace', async () => {
      const account = await configManager.getActiveAccount();
      expect(account).toBeNull();
    });
  });

  describe('listAccounts', () => {
    it('should return empty array initially', () => {
      const accounts = configManager.listAccounts();
      expect(accounts).toEqual([]);
    });
  });

  describe('removeAccount', () => {
    it('should remove workspace', async () => {
      // First add a workspace
      await configManager.addAccount('test', 'test-api-key');
      
      // Clear previous calls to focus on remove operation
      vi.mocked(fs.writeFileSync).mockClear();
      
      // Then remove it
      await configManager.removeAccount('test');
      
      // Verify config was updated (workspace removed)
      const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls;
      const configCall = writeFileCalls.find(call => 
        call[0] === mockConfigFile && 
        typeof call[1] === 'string' && 
        !call[1].includes('test-api-key') &&
        call[1].includes('"workspaces": {}')
      );
      expect(configCall).toBeDefined();
    });

    it('should throw error if workspace does not exist', async () => {
      await expect(configManager.removeAccount('nonexistent'))
        .rejects.toThrow("Workspace 'nonexistent' not found");
    });
  });
});