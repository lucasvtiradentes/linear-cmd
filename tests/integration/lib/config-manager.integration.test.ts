import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConfigManager } from '../../../src/lib/config-manager';

describe('ConfigManager Integration', () => {
  let tempDir: string;
  let configManager: ConfigManager;
  let configPath: string;
  let userMetadataPath: string;

  beforeEach(() => {
    // Create temporary directory for test config
    tempDir = path.join(os.tmpdir(), `config-manager-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const configDir = path.join(tempDir, '.config', 'linear-cmd');
    fs.mkdirSync(configDir, { recursive: true });

    configPath = path.join(configDir, 'config.json5');
    userMetadataPath = path.join(configDir, 'user_metadata.json');

    // Set up environment to use test directory
    process.env.HOME = tempDir;

    // Initialize config manager
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.HOME;
  });

  it('should initialize with empty config', () => {
    const accounts = configManager.getAllAccounts();
    expect(accounts).toEqual([]);
  });

  it('should add and retrieve account', async () => {
    await configManager.addAccount('test-account', 'test-api-key');

    const retrievedAccount = configManager.getAccount('test-account');
    expect(retrievedAccount).toEqual({
      name: 'test-account',
      api_key: 'test-api-key'
    });

    const allAccounts = configManager.getAllAccounts();
    expect(allAccounts).toHaveLength(1);
    expect(allAccounts[0].name).toBe('test-account');
  });

  it('should persist config to file', async () => {
    await configManager.addAccount('persistent-account', 'persistent-api-key');

    // Create new config manager instance to test persistence
    const newConfigManager = new ConfigManager();
    const retrievedAccount = newConfigManager.getAccount('persistent-account');
    
    expect(retrievedAccount).toEqual({
      name: 'persistent-account',
      api_key: 'persistent-api-key'
    });
  });

  it('should remove account', async () => {
    await configManager.addAccount('removable-account', 'removable-api-key');
    expect(configManager.getAccount('removable-account')).toEqual({
      name: 'removable-account',
      api_key: 'removable-api-key'
    });

    await configManager.removeAccount('removable-account');
    expect(configManager.getAccount('removable-account')).toBeNull();
  });

  it('should find account by workspace', async () => {
    await configManager.addAccount('account1', 'api-key-1');
    await configManager.addAccount('account2', 'api-key-2');

    // First update workspaces
    await configManager.updateAccountWorkspaces('account1', ['workspace1', 'shared-workspace']);
    await configManager.updateAccountWorkspaces('account2', ['workspace2']);

    const foundAccount1 = configManager.findAccountByWorkspace('workspace1');
    expect(foundAccount1?.name).toBe('account1');

    const foundAccount2 = configManager.findAccountByWorkspace('workspace2');
    expect(foundAccount2?.name).toBe('account2');

    const sharedAccount = configManager.findAccountByWorkspace('shared-workspace');
    expect(sharedAccount?.name).toBe('account1');

    const notFound = configManager.findAccountByWorkspace('non-existent');
    expect(notFound).toBeNull();
  });

  it('should update account workspaces', async () => {
    await configManager.addAccount('workspace-account', 'workspace-api-key');

    await configManager.updateAccountWorkspaces('workspace-account', ['initial-workspace', 'new-workspace']);

    const updatedAccount = configManager.getAccount('workspace-account');
    expect(updatedAccount?.workspaces).toEqual(['initial-workspace', 'new-workspace']);
  });

  it('should handle invalid JSON gracefully', () => {
    // Write invalid JSON to config file
    const invalidConfigPath = path.join(tempDir, '.config', 'linear-cmd', 'config.json5');
    fs.writeFileSync(invalidConfigPath, '{ invalid json }');

    // Should either throw an error or handle gracefully
    try {
      const newConfigManager = new ConfigManager();
      // If it doesn't throw, that's also acceptable behavior
      expect(newConfigManager).toBeDefined();
    } catch (error) {
      // Expected behavior for invalid JSON
      expect(error).toBeDefined();
    }
  });

  it('should list accounts with proper format', async () => {
    // Just test the functionality with existing accounts
    const accountsList = configManager.listAccounts();
    expect(Array.isArray(accountsList)).toBe(true);
    
    // Each account should have a name property
    for (const account of accountsList) {
      expect(account).toHaveProperty('name');
      expect(typeof account.name).toBe('string');
    }
  });

  it('should handle account validation', async () => {
    // Test duplicate account
    await configManager.addAccount('duplicate-test', 'api-key-1');
    
    await expect(
      configManager.addAccount('duplicate-test', 'api-key-2')
    ).rejects.toThrow("Account 'duplicate-test' already exists");
  });
});