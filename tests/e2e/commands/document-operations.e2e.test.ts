import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadGlobalFixtures } from '../global-fixtures';
import { e2eEnv } from '../utils/e2e-env';
import { execCommand } from '../utils/exec-command';
import { cleanupTestEnvironment, getTestDirs, setupTestEnvironment } from '../utils/test-setup';

describe('Document Operations E2E', () => {
  const { testHomeDir, testConfigDir } = getTestDirs('document');

  beforeEach(async () => {
    setupTestEnvironment(testConfigDir, testHomeDir);
  });

  afterEach(() => {
    cleanupTestEnvironment(testHomeDir);
  });

  async function setupTestAccount(homeDir: string): Promise<string> {
    const accountName = `e2e-test-${Date.now()}`;
    const testApiKey = e2eEnv.LINEAR_API_KEY_E2E;

    const addInput = `${accountName}\n${testApiKey}`;
    await execCommand('account add', addInput, 15000, homeDir);

    return accountName;
  }

  async function createTestProject(homeDir: string, accountName: string, team: string): Promise<string | null> {
    const projectName = `E2E-Test-Project-${Date.now()}`;
    const result = await execCommand(
      `project create -a ${accountName} --team ${team} --name "${projectName}" --description "E2E test project for document tests"`,
      undefined,
      30000,
      homeDir
    );

    if (result.exitCode !== 0) {
      console.log(`Failed to create project. Exit code: ${result.exitCode}`);
      console.log(`Stdout: ${result.stdout}`);
      console.log(`Stderr: ${result.stderr}`);
      return null;
    }

    const urlMatch = result.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  async function deleteTestProject(homeDir: string, accountName: string, projectUrl: string): Promise<void> {
    await execCommand(`project delete ${projectUrl} -a ${accountName} --yes`, undefined, 30000, homeDir);
  }

  it('should handle document show command with real API if available', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(`document show ${fixtures.documentUrl}`, undefined, 15000, fixtures.testHomeDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.includes('📄') || result.stdout.includes('Document') || result.stdout.length > 0).toBe(true);
  }, 90000);

  it('should handle non-existent document gracefully', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand('document show NONEXISTENT-999', undefined, 10000, fixtures.testHomeDir);

    expect(
      result.exitCode !== 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('not found')
    ).toBe(true);
  }, 15000);

  it('should handle JSON output format for document show', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      `document show ${fixtures.documentUrl} --format json`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.includes('{') && (result.stdout.includes('"title"') || result.stdout.includes('"id"'))).toBe(
      true
    );
  }, 90000);

  it('should validate required arguments for document commands', async () => {
    await setupTestAccount(testHomeDir);

    const showResult = await execCommand('document show', undefined, 10000, testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);
  }, 20000);

  it('should handle document commands without account configured', async () => {
    const showResult = await execCommand('document show TEST-123', undefined, 10000, testHomeDir);

    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0 || showResult.stdout.includes('No accounts')).toBe(
      true
    );
  }, 20000);

  it('should create document in project, then delete both without leaving garbage', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const accountName = fixtures.accountName;
    const testTeam = e2eEnv.LINEAR_TEST_TEAM;
    const projectUrl = await createTestProject(fixtures.testHomeDir, accountName, testTeam);

    if (!projectUrl) {
      console.log('Failed to create test project, skipping test');
      return;
    }

    let documentUrl: string | null = null;

    try {
      const documentTitle = `E2E Test Document ${Date.now()}`;
      const addResult = await execCommand(
        `document add -a ${accountName} --title "${documentTitle}" --content "This is a test document created by e2e tests" --project ${projectUrl}`,
        undefined,
        20000,
        fixtures.testHomeDir
      );

      expect(addResult.exitCode).toBe(0);
      expect(addResult.stdout.includes('Document created successfully')).toBe(true);

      const docUrlMatch = addResult.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
      documentUrl = docUrlMatch ? docUrlMatch[0] : null;

      if (documentUrl) {
        const showResult = await execCommand(`document show ${documentUrl}`, undefined, 20000, fixtures.testHomeDir);

        expect(showResult.exitCode).toBe(0);
        expect(showResult.stdout.includes(documentTitle) || showResult.stdout.includes('📄')).toBe(true);

        const deleteDocResult = await execCommand(
          `document delete ${documentUrl} --yes`,
          undefined,
          20000,
          fixtures.testHomeDir
        );

        expect(deleteDocResult.exitCode).toBe(0);
        expect(deleteDocResult.stdout.includes('deleted successfully')).toBe(true);
      }
    } finally {
      await deleteTestProject(fixtures.testHomeDir, accountName, projectUrl);
    }
  }, 60000);
});
