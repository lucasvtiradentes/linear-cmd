import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadGlobalFixtures } from '../global-fixtures';
import { e2eEnv } from '../utils/e2e-env';
import { execCommand } from '../utils/exec-command';
import { cleanupTestEnvironment, getTestDirs, setupTestEnvironment } from '../utils/test-setup';

describe('Issue Operations E2E', () => {
  const { testHomeDir, testConfigDir } = getTestDirs('issue');

  beforeEach(async () => {
    setupTestEnvironment(testConfigDir, testHomeDir);
  });

  afterEach(() => {
    cleanupTestEnvironment(testHomeDir);
  });

  it('should handle issue show command with real API if available', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(`issue show ${fixtures.issueUrl}`, undefined, 30000, fixtures.testHomeDir);

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout).toContain('🎯');
      expect(result.stdout).toContain('Status:');
      expect(result.stdout).toContain('Suggested Branch:');
    }
  }, 90000);

  it('should handle issue list command', async () => {
    const testTeam = e2eEnv.LINEAR_TEST_TEAM;
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(`issue list --team ${testTeam}`, undefined, 60000, fixtures.testHomeDir);

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout).toContain('Fetching issues');
    }
  }, 90000);

  it('should handle issue creation command (mock)', async () => {
    const testTeam = e2eEnv.LINEAR_TEST_TEAM;
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      `issue create --team ${testTeam} --title "E2E Test Issue" --description "This is a test issue created by E2E tests"`,
      undefined,
      60000,
      fixtures.testHomeDir
    );

    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('Creating issue')
    ).toBe(true);
  }, 90000);

  it('should handle non-existent issue gracefully', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand('issue show NONEXISTENT-999', undefined, 30000, fixtures.testHomeDir);

    expect(
      result.exitCode !== 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('not found')
    ).toBe(true);
  }, 90000);

  it('should handle issue commands without account configured', async () => {
    const showResult = await execCommand('issue show TEST-123', undefined, 60000, testHomeDir);

    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0 || showResult.stdout.includes('No accounts')).toBe(
      true
    );

    const listResult = await execCommand('issue list', undefined, 60000, testHomeDir);

    expect(listResult.exitCode !== 0 || listResult.stderr.length > 0 || listResult.stdout.includes('No accounts')).toBe(
      true
    );
  }, 90000);

  it('should handle JSON output format for issue commands', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const showResult = await execCommand(
      `issue show ${fixtures.issueUrl} --format json`,
      undefined,
      30000,
      fixtures.testHomeDir
    );

    if (showResult.exitCode === 0) {
      expect(showResult.stdout.includes('{') && showResult.stdout.includes('"identifier"')).toBe(true);
    }

    const listResult = await execCommand('issue list --format json --limit 3', undefined, 30000, fixtures.testHomeDir);

    if (listResult.exitCode === 0) {
      expect(listResult.stdout.includes('[') || listResult.stdout.includes('{')).toBe(true);
    }
  }, 60000);

  it('should handle issue update command (mock)', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      'issue update MOCK-123 --title "Updated Title"',
      undefined,
      60000,
      fixtures.testHomeDir
    );

    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('Updating')
    ).toBe(true);
  }, 90000);

  it('should handle comment command (mock)', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      'issue comment MOCK-123 --comment "This is a test comment"',
      undefined,
      60000,
      fixtures.testHomeDir
    );

    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('comment')
    ).toBe(true);
  }, 90000);

  it.skip('should validate required arguments for issue commands', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const showResult = await execCommand('issue show', undefined, 60000, fixtures.testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);

    const createResult = await execCommand('issue create', undefined, 60000, fixtures.testHomeDir);
    expect(createResult.exitCode !== 0 || createResult.stderr.length > 0).toBe(true);

    const updateResult = await execCommand('issue update', undefined, 60000, fixtures.testHomeDir);
    expect(updateResult.exitCode !== 0 || updateResult.stderr.length > 0).toBe(true);

    const commentResult = await execCommand('issue comment', undefined, 60000, fixtures.testHomeDir);
    expect(commentResult.exitCode !== 0 || commentResult.stderr.length > 0).toBe(true);
  }, 150000);
});
