import * as fs from 'fs';
import * as keytar from 'keytar';
import * as path from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ConfigManager, APP_NAME } from '../../../lib/config';

vi.mock('fs');
vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/test')
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockHomeDir = '/home/test';
  const mockConfigDir = path.join(mockHomeDir, `.${APP_NAME}`);
  const mockConfigFile = path.join(mockConfigDir, 'config.json');

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mocks
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    it('should create config directory if it does not exist', () => {
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
    });

    it('should load existing config if file exists', () => {
      const mockConfig = { accounts: [{ id: 'test-1', name: 'test' }] };
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      new ConfigManager();

      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf-8');
    });
  });

  describe('addAccount', () => {
    it('should add a new account and store API key securely', async () => {
      await configManager.addAccount('test', 'test-api-key');

      expect(keytar.setPassword).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();

      const savedConfig = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);

      expect(savedConfig.accounts).toHaveLength(1);
      expect(savedConfig.accounts[0].name).toBe('test');
      expect(savedConfig.accounts[0].apiKey).toBe(''); // Should not store in config
      expect(savedConfig.accounts[0].isActive).toBe(true);
    });

    it('should set first account as active', async () => {
      await configManager.addAccount('first', 'api-key-1');

      const savedConfig = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1] as string);

      expect(savedConfig.activeAccountId).toBe(savedConfig.accounts[0].id);
    });
  });

  describe('getActiveAccount', () => {
    it('should return null if no active account', async () => {
      const account = await configManager.getActiveAccount();
      expect(account).toBeNull();
    });

    it('should retrieve account with API key from secure storage', async () => {
      // Setup existing config
      const mockConfig = {
        accounts: [
          {
            id: 'test-123',
            name: 'test',
            apiKey: '',
            isActive: true,
            workspaces: []
          }
        ],
        activeAccountId: 'test-123'
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(keytar.getPassword).mockResolvedValue('secure-api-key');

      configManager = new ConfigManager();
      const account = await configManager.getActiveAccount();

      expect(account).not.toBeNull();
      expect(account?.apiKey).toBe('secure-api-key');
      expect(keytar.getPassword).toHaveBeenCalledWith(APP_NAME, 'test-123');
    });
  });

  describe('removeAccount', () => {
    it('should remove account and clean up API key', async () => {
      // First add an account
      await configManager.addAccount('test', 'test-api-key');

      // Then remove it
      await configManager.removeAccount('test');

      expect(keytar.deletePassword).toHaveBeenCalled();

      const savedConfig = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[1][1] as string);

      expect(savedConfig.accounts).toHaveLength(0);
    });

    it('should throw error if account does not exist', async () => {
      await expect(configManager.removeAccount('nonexistent')).rejects.toThrow("Account 'nonexistent' not found");
    });
  });

  describe('findAccountByWorkspace', () => {
    it('should find account by workspace', () => {
      const mockConfig = {
        accounts: [
          {
            id: 'test-123',
            name: 'test',
            apiKey: '',
            isActive: true,
            workspaces: ['workspace1', 'workspace2']
          }
        ],
        activeAccountId: 'test-123'
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      configManager = new ConfigManager();
      const account = configManager.findAccountByWorkspace('workspace1');

      expect(account).not.toBeNull();
      expect(account?.name).toBe('test');
    });

    it('should return null if workspace not found', () => {
      const account = configManager.findAccountByWorkspace('unknown');
      expect(account).toBeNull();
    });
  });
});
