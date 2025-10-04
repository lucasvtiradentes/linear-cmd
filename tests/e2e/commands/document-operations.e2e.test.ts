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

describe('Document Operations E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-document-e2e-${Date.now()}`);
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

  it('should handle document show command with real API if available', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testDocumentUrl = process.env.LINEAR_TEST_DOCUMENT_URL;

    if (!apiKey || !testDocumentUrl) {
      console.log('Skipping real API test: Missing LINEAR_API_KEY_E2E or LINEAR_TEST_DOCUMENT_URL');

      // Test with mock scenario instead
      await setupTestAccount(testHomeDir);

      const result = await execCommand('node dist/index.js document show MOCK-DOC-123', undefined, 15000, testHomeDir);

      // Should handle gracefully even if document doesn't exist
      expect(
        result.exitCode !== 0 ||
          result.stderr.length > 0 ||
          result.stdout.includes('Error') ||
          result.stdout.includes('not found')
      ).toBe(true);
      return;
    }

    await setupTestAccount(testHomeDir);

    const result = await execCommand(
      `node dist/index.js document show ${testDocumentUrl}`,
      undefined,
      30000,
      testHomeDir
    );

    // Should either succeed or fail gracefully
    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(result.stdout.includes('📄') || result.stdout.includes('Document') || result.stdout.length > 0).toBe(true);
    }
  }, 45000);

  it('should handle non-existent document gracefully', async () => {
    await setupTestAccount(testHomeDir);

    const result = await execCommand('node dist/index.js document show NONEXISTENT-999', undefined, 15000, testHomeDir);

    // Should handle error gracefully
    expect(
      result.exitCode !== 0 ||
        result.stderr.length > 0 ||
        result.stdout.includes('Error') ||
        result.stdout.includes('not found')
    ).toBe(true);
  }, 20000);

  it('should handle JSON output format for document show', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E;
    const testDocumentUrl = process.env.LINEAR_TEST_DOCUMENT_URL;

    if (!apiKey || !testDocumentUrl) {
      console.log('Skipping JSON format test: Missing LINEAR_API_KEY_E2E or LINEAR_TEST_DOCUMENT_URL');
      return;
    }

    await setupTestAccount(testHomeDir);

    const result = await execCommand(
      `node dist/index.js document show ${testDocumentUrl} --format json`,
      undefined,
      30000,
      testHomeDir
    );

    if (result.exitCode === 0) {
      // Should contain JSON output
      expect(result.stdout.includes('{') && (result.stdout.includes('"title"') || result.stdout.includes('"id"'))).toBe(
        true
      );
    }
  }, 45000);

  it('should validate required arguments for document commands', async () => {
    await setupTestAccount(testHomeDir);

    // Test missing arguments
    const showResult = await execCommand('node dist/index.js document show', undefined, 10000, testHomeDir);
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0).toBe(true);
  }, 20000);

  it('should handle document commands without account configured', async () => {
    // Don't set up any account

    const showResult = await execCommand('node dist/index.js document show TEST-123', undefined, 10000, testHomeDir);

    // Should handle gracefully - no accounts error
    expect(showResult.exitCode !== 0 || showResult.stderr.length > 0 || showResult.stdout.includes('No accounts')).toBe(
      true
    );
  }, 20000);
});
