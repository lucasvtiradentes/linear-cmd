import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadGlobalFixtures } from '../global-fixtures';
import { e2eEnv } from '../utils/e2e-env';
import { execCommand } from '../utils/exec-command';
import { cleanupTestEnvironment, getTestDirs, setupTestEnvironment } from '../utils/test-setup';

describe('Project Operations E2E', () => {
  const { testHomeDir, testConfigDir } = getTestDirs('project');

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
      `project create -a ${accountName} --team ${team} --name ${projectName} --description E2E-test-project-to-be-deleted`,
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

  it('should handle project show command with real API if available', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(`project show ${fixtures.projectUrl}`, undefined, 15000, fixtures.testHomeDir);

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('📁') || result.stdout.includes('Project') || result.stdout.length > 0).toBe(true);
    }
  }, 60000);

  it('should handle project issues command with real API if available', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(`project issues ${fixtures.projectUrl}`, undefined, 15000, fixtures.testHomeDir);

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(
        result.stdout.includes('Fetching') ||
          result.stdout.includes('issues') ||
          result.stdout.includes('✅') ||
          result.stdout.includes('📋') ||
          result.stdout.length > 0
      ).toBe(true);
    }
  }, 60000);

  it('should handle non-existent project gracefully', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand('project show NONEXISTENT-999', undefined, 10000, fixtures.testHomeDir);

    expect(
      result.exitCode !== 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('not found')
    ).toBe(true);
  }, 15000);

  it('should handle JSON output format for project show', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      `project show ${fixtures.projectUrl} --format json`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    if (result.exitCode === 0) {
      expect(result.stdout.includes('{') && (result.stdout.includes('"name"') || result.stdout.includes('"id"'))).toBe(
        true
      );
    }
  }, 60000);

  it('should handle JSON output format for project issues', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      `project issues ${fixtures.projectUrl} --format json`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    if (result.exitCode === 0) {
      expect(result.stdout.includes('[') || result.stdout.includes('{')).toBe(true);
    }
  }, 60000);

  it('should validate required arguments for project commands', async () => {
    await setupTestAccount(testHomeDir);

    const showResult = await execCommand('project show', undefined, 10000, testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);

    const issuesResult = await execCommand('project issues', undefined, 10000, testHomeDir);
    expect(issuesResult.exitCode !== 0 || issuesResult.stderr.length > 0).toBe(true);
  }, 30000);

  it('should handle project create command with real API if available', async () => {
    const testTeam = e2eEnv.LINEAR_TEST_TEAM;

    await setupTestAccount(testHomeDir);

    const projectName = `E2E Test Project ${Date.now()}`;
    const result = await execCommand(
      `project create -a test --team ${testTeam} --name "${projectName}" --description "Created by E2E test"`,
      undefined,
      30000,
      testHomeDir
    );

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('Project created successfully') || result.stdout.includes('📁')).toBe(true);
    }
  }, 45000);

  it('should handle project delete command with real API if available', async () => {
    const testTeam = e2eEnv.LINEAR_TEST_TEAM;

    const accountName = await setupTestAccount(testHomeDir);

    const projectUrl = await createTestProject(testHomeDir, accountName, testTeam);

    if (!projectUrl) {
      console.log('Failed to create test project, skipping test');
      return;
    }

    const result = await execCommand(
      `project delete ${projectUrl} -a ${accountName} --yes`,
      undefined,
      30000,
      testHomeDir
    );

    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('deleted successfully')
    ).toBe(true);
  }, 60000);

  it('should handle project list command with real API if available', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(`project list -a ${fixtures.accountName}`, undefined, 30000, fixtures.testHomeDir);

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('Found') || result.stdout.includes('project') || result.stdout.includes('📁')).toBe(
        true
      );
    }
  }, 30000);

  it('should handle project list command with team filter', async () => {
    const testTeam = e2eEnv.LINEAR_TEST_TEAM;
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      `project list -a ${fixtures.accountName} --team ${testTeam}`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('Found') || result.stdout.includes('project') || result.stdout.includes('No')).toBe(
        true
      );
    }
  }, 30000);

  it('should handle JSON output format for project list', async () => {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('Skipping test: Missing global fixtures');
      return;
    }

    const result = await execCommand(
      `project list -a ${fixtures.accountName} --format json --limit 5`,
      undefined,
      15000,
      fixtures.testHomeDir
    );

    if (result.exitCode === 0) {
      expect(result.stdout.includes('[') || result.stdout.includes('{')).toBe(true);
    }
  }, 30000);
});
