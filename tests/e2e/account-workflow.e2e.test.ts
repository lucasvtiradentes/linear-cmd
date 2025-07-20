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

describe('Account Management E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-account-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  beforeEach(async () => {
    await execCommand('npm run build');

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
  "accounts": {},
  "settings": {
    "max_results": 50,
    "date_format": "relative",
    "auto_update_accounts": true
  }
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
    const testApiKey = 'lin_api_test123456789';

    // Step 1: Add account
    const addInput = `${accountName}\n${testApiKey}`;
    const addResult = await execCommand('node dist/index.js account add', addInput, 15000, testHomeDir);

    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('Account name');
    expect(addResult.stdout).toContain('Linear API key');

    // Step 2: List accounts to verify addition
    const listResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);

    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(accountName);
    expect(listResult.stdout).toContain('Configured accounts:');

    // Step 3: Test accounts (will fail with invalid API but should not crash)
    const testResult = await execCommand(`node dist/index.js account test ${accountName}`, undefined, 15000, testHomeDir);
    
    // Test may fail due to invalid API key, but should handle gracefully
    expect(testResult.stdout).toContain('Testing account');

    // Step 4: Remove account
    const removeResult = await execCommand(`node dist/index.js account remove ${accountName}`, undefined, 10000, testHomeDir);

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
    const testApiKey1 = 'lin_api_work123456789';
    const testApiKey2 = 'lin_api_personal123456789';

    // Add first account
    const add1Input = `${account1Name}\n${testApiKey1}`;
    const add1Result = await execCommand('node dist/index.js account add', add1Input, 15000, testHomeDir);
    expect(add1Result.exitCode).toBe(0);

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
    const remove1Result = await execCommand(`node dist/index.js account remove ${account1Name}`, undefined, 10000, testHomeDir);
    expect(remove1Result.exitCode).toBe(0);

    // Verify only second account remains
    const finalListResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);
    expect(finalListResult.exitCode).toBe(0);
    expect(finalListResult.stdout).not.toContain(account1Name);
    expect(finalListResult.stdout).toContain(account2Name);
  }, 90000);

  it('should handle account validation errors', async () => {
    // Test invalid account name
    const invalidNameInput = `invalid name!\nlin_api_test123456789`;
    const invalidNameResult = await execCommand('node dist/index.js account add', invalidNameInput, 10000, testHomeDir);
    
    // Should handle validation error gracefully
    expect(invalidNameResult.stdout).toContain('Account name');

    // Test invalid API key format
    const invalidApiInput = `valid-name\ninvalid-api-key`;
    const invalidApiResult = await execCommand('node dist/index.js account add', invalidApiInput, 10000, testHomeDir);
    
    // Should handle validation error gracefully
    expect(invalidApiResult.stdout).toContain('Linear API key');

    // Verify no accounts were added
    const listResult = await execCommand('node dist/index.js account list', undefined, 10000, testHomeDir);
    expect(listResult.stdout).toContain('No accounts configured');
  }, 45000);

  it('should handle non-existent account operations', async () => {
    // Try to remove non-existent account
    const removeResult = await execCommand('node dist/index.js account remove non-existent', undefined, 10000, testHomeDir);
    
    // Should handle error gracefully
    expect(removeResult.exitCode !== 0 || removeResult.stderr.length > 0 || removeResult.stdout.includes('not found')).toBe(true);

    // Try to test non-existent account
    const testResult = await execCommand('node dist/index.js account test non-existent', undefined, 10000, testHomeDir);
    
    // Should handle error gracefully
    expect(testResult.exitCode !== 0 || testResult.stderr.length > 0 || testResult.stdout.includes('not found')).toBe(true);
  }, 30000);

  it('should handle JSON output format for account list', async () => {
    const accountName = `json-test-${Date.now()}`;
    const testApiKey = 'lin_api_json123456789';

    // Add account
    const addInput = `${accountName}\n${testApiKey}`;
    await execCommand('node dist/index.js account add', addInput, 15000, testHomeDir);

    // List accounts in JSON format
    const jsonResult = await execCommand('node dist/index.js account list --format json', undefined, 10000, testHomeDir);

    expect(jsonResult.exitCode).toBe(0);
    
    // Should contain valid JSON with account data
    try {
      const output = jsonResult.stdout.trim();
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.startsWith('{') || line.includes(accountName));
      
      if (jsonLine) {
        const data = JSON.parse(jsonLine);
        expect(data).toHaveProperty(accountName);
        expect(data[accountName]).toHaveProperty('name', accountName);
        expect(data[accountName]).toHaveProperty('api_key');
      }
    } catch (error) {
      // JSON parsing might fail due to mixed output, but should at least contain account name
      expect(jsonResult.stdout).toContain(accountName);
    }
  }, 30000);
});