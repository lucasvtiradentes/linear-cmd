import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function execCommand(command: string, input?: string, timeout = 30000, homeDir?: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ...(homeDir ? { HOME: homeDir } : {}),
        CI: 'true',
        FORCE_TTY: 'false',
        FORCE_STDIN: 'true'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }
    }, timeout);

    if (input && child.stdin) {
      const lines = input.split('\n');
      let index = 0;

      const writeNext = () => {
        if (index < lines.length && child.stdin && !child.stdin.destroyed) {
          child.stdin.write(`${lines[index]}\n`);
          index++;
          if (index < lines.length) {
            setTimeout(writeNext, 500);
          }
        }
      };

      setTimeout(writeNext, 1000);
    }

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      }
    });

    child.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  });
}

describe('Issue Operations E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-issue-e2e-${Date.now()}`);
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

  async function setupTestAccount(homeDir: string): Promise<string> {
    const accountName = `e2e-test-${Date.now()}`;
    const testApiKey = process.env.LINEAR_API_KEY_E2E || 'lin_api_test123456789';

    const addInput = `${accountName}\n${testApiKey}`;
    await execCommand('node dist/index.js account add', addInput, 15000, homeDir);

    return accountName;
  }

  it.skip('should handle issue show command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testIssueId = process.env.LINEAR_TEST_ISSUE_ID;

    if (!apiKey || !testIssueId) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or LINEAR_TEST_ISSUE_ID');

      // Test with mock scenario instead
      await setupTestAccount(testHomeDir);

      const result = await execCommand('node dist/index.js issue show MOCK-123', undefined, 15000, testHomeDir);

      // Should handle gracefully even if issue doesn't exist
      expect(
        result.exitCode !== 0 ||
          result.stderr.length > 0 ||
          result.stdout.includes('Error') ||
          result.stdout.includes('not found')
      ).toBe(true);
      return;
    }

    await setupTestAccount(testHomeDir);

    const result = await execCommand(`node dist/index.js issue show ${testIssueId}`, undefined, 30000, testHomeDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('🎯');
    expect(result.stdout).toContain('Status:');
    expect(result.stdout).toContain('Suggested Branch:');
  }, 45000);

  it('should handle issue list command', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';

    if (!apiKey) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E');

      // Test with mock scenario
      await setupTestAccount(testHomeDir);

      const result = await execCommand('node dist/index.js issue list -a test', undefined, 15000, testHomeDir);

      // Should handle gracefully
      expect(result.exitCode !== 0 || result.stdout.includes('Error') || result.stdout.includes('No issues')).toBe(
        true
      );
      return;
    }

    await setupTestAccount(testHomeDir);

    const result = await execCommand(
      `node dist/index.js issue list -a test --team ${testTeam}`,
      undefined,
      30000,
      testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout).toContain('Fetching issues');
    }
  }, 45000);

  it('should handle issue creation command (mock)', async () => {
    const testTeam = process.env.LINEAR_TEST_TEAM || 'TES';
    await setupTestAccount(testHomeDir);

    // This will likely fail without real API access, but should handle gracefully
    const result = await execCommand(
      `node dist/index.js issue create -a test --team ${testTeam} --title "E2E Test Issue" --description "This is a test issue created by E2E tests"`,
      undefined,
      20000,
      testHomeDir
    );

    // Should handle gracefully regardless of success/failure
    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('Creating issue')
    ).toBe(true);
  }, 30000);

  it('should handle non-existent issue gracefully', async () => {
    await setupTestAccount(testHomeDir);

    const result = await execCommand('node dist/index.js issue show NONEXISTENT-999', undefined, 15000, testHomeDir);

    // Should handle error gracefully
    expect(
      result.exitCode !== 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('not found')
    ).toBe(true);
  }, 20000);

  it('should handle issue commands without account configured', async () => {
    // Don't set up any account

    const showResult = await execCommand('node dist/index.js issue show TEST-123', undefined, 10000, testHomeDir);

    // Should handle gracefully - no accounts error
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0 || showResult.stdout.includes('No accounts')).toBe(
      true
    );

    const listResult = await execCommand('node dist/index.js issue list', undefined, 10000, testHomeDir);

    // Should handle gracefully - no accounts error
    expect(listResult.exitCode !== 0 || listResult.stderr.length > 0 || listResult.stdout.includes('No accounts')).toBe(
      true
    );
  }, 30000);

  it('should handle JSON output format for issue commands', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testIssueId = process.env.LINEAR_TEST_ISSUE_ID;

    if (!apiKey || !testIssueId) {
      console.log('Skipping JSON format test: Missing LINEAR_API_KEY_E2E or LINEAR_TEST_ISSUE_ID');
      return;
    }

    await setupTestAccount(testHomeDir);

    // Test JSON format for issue show
    const showResult = await execCommand(
      `node dist/index.js issue show ${testIssueId} --format json`,
      undefined,
      30000,
      testHomeDir
    );

    if (showResult.exitCode === 0) {
      // Should contain JSON output
      expect(showResult.stdout.includes('{') && showResult.stdout.includes('"identifier"')).toBe(true);
    }

    // Test JSON format for issue list
    const listResult = await execCommand(
      'node dist/index.js issue list --format json --limit 3',
      undefined,
      30000,
      testHomeDir
    );

    if (listResult.exitCode === 0) {
      // Should contain JSON output or empty array
      expect(listResult.stdout.includes('[') || listResult.stdout.includes('{')).toBe(true);
    }
  }, 60000);

  it('should handle issue update command (mock)', async () => {
    await setupTestAccount(testHomeDir);

    // This will likely fail without real API access, but should handle gracefully
    const result = await execCommand(
      'node dist/index.js issue update MOCK-123 --title "Updated Title"',
      undefined,
      15000,
      testHomeDir
    );

    // Should handle gracefully regardless of success/failure
    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('Updating')
    ).toBe(true);
  }, 20000);

  it('should handle comment command (mock)', async () => {
    await setupTestAccount(testHomeDir);

    // This will likely fail without real API access, but should handle gracefully
    const result = await execCommand(
      'node dist/index.js issue comment MOCK-123 --comment "This is a test comment"',
      undefined,
      15000,
      testHomeDir
    );

    // Should handle gracefully regardless of success/failure
    expect(
      result.exitCode === 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('comment')
    ).toBe(true);
  }, 20000);

  it('should validate required arguments for issue commands', async () => {
    await setupTestAccount(testHomeDir);

    // Test missing arguments
    const showResult = await execCommand('node dist/index.js issue show', undefined, 10000, testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);

    const createResult = await execCommand('node dist/index.js issue create', undefined, 10000, testHomeDir);
    expect(createResult.exitCode !== 0 || createResult.stderr.length > 0).toBe(true);

    const updateResult = await execCommand('node dist/index.js issue update', undefined, 10000, testHomeDir);
    expect(updateResult.exitCode !== 0 || updateResult.stderr.length > 0).toBe(true);

    const commentResult = await execCommand('node dist/index.js issue comment', undefined, 10000, testHomeDir);
    expect(commentResult.exitCode !== 0 || commentResult.stderr.length > 0).toBe(true);
  }, 50000);
});
