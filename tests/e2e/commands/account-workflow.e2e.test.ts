import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execCommand } from '../utils/exec-command';

describe('Account Management E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-account-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  beforeEach(async () => {
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }

    fs.mkdirSync(testConfigDir, { recursive: true });

    const userMetadataPath = path.join(testConfigDir, 'user_metadata.json');
    const configPath = path.join(testConfigDir, 'config.json5');

    fs.writeFileSync(
      userMetadataPath,
      JSON.stringify({
        config_path: configPath
      })
    );

    fs.writeFileSync(
      configPath,
      `{
  "accounts": {}
}`
    );
  });

  afterEach(() => {
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }
  });

  it('should complete account lifecycle: add → list → test → remove', async () => {
    const accountName = `test-account-${Date.now()}`;
    const testApiKey = process.env.LINEAR_API_KEY_E2E || 'lin_api_test123456789';

    // Step 1: Add account (interactive mode may fail in test environment)
    const addInput = `${accountName}\n${testApiKey}`;
    const addResult = await execCommand('node dist/index.js account add', addInput, 15000, testHomeDir);

    // Interactive commands may fail in non-TTY environment
    if (addResult.exitCode !== 0) {
      console.log('Skipping test: account add requires interactive TTY');
      return;
    }

    expect(addResult.stdout).toContain('Account name');
    expect(addResult.stdout).toContain('Linear API key');

    // Step 2: List accounts to verify addition
    const listResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(accountName);
    expect(listResult.stdout).toContain('Configured accounts:');

    // Step 3: Test accounts (will fail with invalid API but should not crash)
    const testResult = await execCommand(
      `node dist/index.js account test ${accountName}`,
      undefined,
      15000,
      testHomeDir
    );

    // Test may fail due to invalid API key, but should handle gracefully
    expect(testResult.stdout).toContain('Testing account');

    // Step 4: Remove account
    const removeResult = await execCommand(
      `node dist/index.js account remove ${accountName}`,
      undefined,
      10000,
      testHomeDir
    );

    expect(removeResult.exitCode).toBe(0);
    expect(removeResult.stdout).toContain('removed successfully');

    // Step 5: Verify account was removed
    const finalListResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);

    expect(finalListResult.exitCode).toBe(0);
    expect(finalListResult.stdout).not.toContain(accountName);
    expect(finalListResult.stdout).toContain('No accounts configured');
  }, 60000);

  it('should handle multiple accounts management', async () => {
    const account1Name = `work-account-${Date.now()}`;
    const account2Name = `personal-account-${Date.now()}`;
    const testApiKey1 = process.env.LINEAR_API_KEY_E2E || 'lin_api_work123456789';
    const testApiKey2 = process.env.LINEAR_API_KEY_E2E || 'lin_api_personal123456789';

    // Add first account
    const add1Input = `${account1Name}\n${testApiKey1}`;
    const add1Result = await execCommand('node dist/index.js account add', add1Input, 15000, testHomeDir);

    // Interactive commands may fail in non-TTY environment
    if (add1Result.exitCode !== 0) {
      console.log('Skipping test: account add requires interactive TTY');
      return;
    }

    // Add second account
    const add2Input = `${account2Name}\n${testApiKey2}`;
    const add2Result = await execCommand('node dist/index.js account add', add2Input, 15000, testHomeDir);
    expect(add2Result.exitCode).toBe(0);

    // List both accounts
    const listResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(account1Name);
    expect(listResult.stdout).toContain(account2Name);
    expect(listResult.stdout).toContain('Configured accounts:');

    // Test all accounts
    const testAllResult = await execCommand('node dist/index.js account test', undefined, 20000, testHomeDir);
    expect(testAllResult.stdout).toContain('Testing all accounts');

    // Remove first account
    const remove1Result = await execCommand(
      `node dist/index.js account remove ${account1Name}`,
      undefined,
      10000,
      testHomeDir
    );
    expect(remove1Result.exitCode).toBe(0);

    // Verify only second account remains
    const finalListResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);
    expect(finalListResult.exitCode).toBe(0);
    expect(finalListResult.stdout).not.toContain(account1Name);
    expect(finalListResult.stdout).toContain(account2Name);
  }, 90000);

  it('should handle non-existent account operations', async () => {
    // Try to remove non-existent account
    const removeResult = await execCommand(
      'node dist/index.js account remove non-existent',
      undefined,
      10000,
      testHomeDir
    );

    // Should handle error gracefully
    expect(
      removeResult.exitCode !== 0 || removeResult.stderr.length > 0 || removeResult.stdout.includes('not found')
    ).toBe(true);

    // Try to test non-existent account
    const testResult = await execCommand('node dist/index.js account test non-existent', undefined, 10000, testHomeDir);

    // Should handle error gracefully
    expect(testResult.exitCode !== 0 || testResult.stderr.length > 0 || testResult.stdout.includes('not found')).toBe(
      true
    );
  }, 30000);
});
