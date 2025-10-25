import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { e2eEnv } from '../utils/e2e-env';
import { execCommand } from '../utils/exec-command';
import { cleanupTestEnvironment, getTestDirs, setupTestEnvironment } from '../utils/test-setup';

describe('Account Management E2E', () => {
  const { testHomeDir, testConfigDir } = getTestDirs('account');

  beforeEach(async () => {
    setupTestEnvironment(testConfigDir, testHomeDir);
  });

  afterEach(() => {
    cleanupTestEnvironment(testHomeDir);
  });

  it('should complete account lifecycle: add → list → test → remove', async () => {
    const accountName = `test-account-${Date.now()}`;
    const testApiKey = e2eEnv.LINEAR_API_KEY_E2E;

    const addResult = await execCommand(
      `account add --name "${accountName}" --api-key "${testApiKey}"`,
      undefined,
      15000,
      testHomeDir
    );

    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('added successfully');

    const listResult = await execCommand('account list', undefined, 10000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(accountName);
    expect(listResult.stdout).toContain('Configured accounts:');

    const testResult = await execCommand('account test', undefined, 15000, testHomeDir);

    expect(testResult.exitCode).toBe(0);
    expect(testResult.stdout).toContain(accountName);

    const removeResult = await execCommand(`account remove`, `${accountName}\ny`, 10000, testHomeDir);

    expect(removeResult.exitCode).toBe(0);
    expect(removeResult.stdout).toContain('removed successfully');

    const finalListResult = await execCommand('account list', undefined, 10000, testHomeDir);

    expect(finalListResult.exitCode).toBe(0);
    expect(finalListResult.stdout).not.toContain(accountName);
    expect(finalListResult.stdout).toContain('No accounts configured');
  }, 60000);

  it.skip('should handle multiple accounts management', async () => {
    const account1Name = `work-account-${Date.now()}`;
    const account2Name = `personal-account-${Date.now()}`;
    const testApiKey1 = e2eEnv.LINEAR_API_KEY_E2E;
    const testApiKey2 = e2eEnv.LINEAR_API_KEY_E2E;

    const add1Result = await execCommand(
      `account add --name "${account1Name}" --api-key "${testApiKey1}"`,
      undefined,
      15000,
      testHomeDir
    );
    expect(add1Result.exitCode).toBe(0);

    const add2Result = await execCommand(
      `account add --name "${account2Name}" --api-key "${testApiKey2}"`,
      undefined,
      15000,
      testHomeDir
    );
    expect(add2Result.exitCode).toBe(0);

    const listResult = await execCommand('account list', undefined, 10000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(account1Name);
    expect(listResult.stdout).toContain(account2Name);
    expect(listResult.stdout).toContain('Configured accounts:');

    const testAllResult = await execCommand('account test', undefined, 20000, testHomeDir);
    expect(testAllResult.stdout).toContain(account1Name);

    const remove1Result = await execCommand('account remove', `${account1Name}\ny`, 10000, testHomeDir);
    expect(remove1Result.exitCode).toBe(0);

    const finalListResult = await execCommand('account list', undefined, 10000, testHomeDir);
    expect(finalListResult.exitCode).toBe(0);
    expect(finalListResult.stdout).not.toContain(account1Name);
    expect(finalListResult.stdout).toContain(account2Name);
  }, 90000);

  it('should handle non-existent account operations', async () => {
    const removeResult = await execCommand('account remove non-existent', undefined, 10000, testHomeDir);

    expect(
      removeResult.exitCode !== 0 || removeResult.stderr.length > 0 || removeResult.stdout.includes('not found')
    ).toBe(true);

    const testResult = await execCommand('account test non-existent', undefined, 10000, testHomeDir);

    expect(testResult.exitCode !== 0 || testResult.stderr.length > 0 || testResult.stdout.includes('not found')).toBe(
      true
    );
  }, 30000);
});
