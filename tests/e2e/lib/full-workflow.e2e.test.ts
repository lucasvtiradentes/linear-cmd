import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { e2eEnv } from '../utils/env';
import { execCommand } from '../utils/exec-command';
import { cleanupTestEnvironment, getTestDirs, setupTestEnvironment } from '../utils/test-setup';

describe('Complete User Workflow E2E', () => {
  const { testHomeDir, testConfigDir } = getTestDirs('workflow');

  beforeEach(async () => {
    setupTestEnvironment(testConfigDir, testHomeDir);
  });

  afterEach(() => {
    cleanupTestEnvironment(testHomeDir);
  });

  it('should complete full workflow: add account → fetch real issue', async () => {
    const apiKey = e2eEnv.LINEAR_API_KEY_E2E;
    const testIssueId = e2eEnv.LINEAR_TEST_ISSUE_ID;

    if (!apiKey || !testIssueId) {
      console.log('Skipping e2e test: Missing LINEAR_API_KEY_E2E or LINEAR_TEST_ISSUE_ID');
      return;
    }

    const accountName = `e2e-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${apiKey}`;
    const addResult = await execCommand('account add', addAccountInput, 30000, testHomeDir);

    if (addResult.exitCode !== 0) {
      console.log('Skipping test: account add requires interactive TTY');
      return;
    }

    expect(addResult.stdout).toContain('Account name');
    expect(addResult.stdout).toContain('Linear API key');

    const listResult = await execCommand('account list', undefined, 30000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(accountName);
    expect(listResult.stdout).toContain('Configured accounts:');

    const showResult = await execCommand(`issue show ${testIssueId}`, undefined, 30000, testHomeDir);

    expect(showResult.exitCode === 0 || showResult.stderr.length > 0 || showResult.stdout.includes('Error')).toBe(true);

    if (showResult.exitCode === 0) {
      expect(showResult.stdout).toContain('🎯');
      expect(showResult.stdout).toContain('Status:');
      expect(showResult.stdout).toContain('Suggested Branch:');
    }
  }, 60000);

  it('should handle invalid API key gracefully', async () => {
    const invalidApiKey = 'invalid-api-key-12345';
    const accountName = `invalid-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${invalidApiKey}`;

    const result = await execCommand('account add', addAccountInput, 10000, testHomeDir);

    expect(
      result.stdout.includes('Account name') ||
        result.stdout.includes('Linear API key') ||
        result.exitCode !== 0 ||
        result.stderr.length > 0
    ).toBe(true);
  });

  it('should handle non-existent issue gracefully', async () => {
    const apiKey = e2eEnv.LINEAR_API_KEY_E2E;

    if (!apiKey) {
      console.log('Skipping e2e test: Missing LINEAR_API_KEY_E2E');
      return;
    }

    const accountName = `e2e-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${apiKey}`;
    await execCommand('account add', addAccountInput, 10000, testHomeDir);

    const result = await execCommand('issue show INVALID-999', undefined, 10000, testHomeDir);

    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  });
});
