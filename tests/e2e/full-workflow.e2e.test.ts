import { spawn } from 'child_process';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function execCommand(command: string, input?: string, timeout = 30000): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: path.resolve(__dirname, '../../'),
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        // Use test config directory to avoid conflicts
        HOME: path.join(os.tmpdir(), 'linear-cli-e2e-test'),
        // Force non-interactive mode for inquirer
        CI: 'true',
        FORCE_TTY: 'false',
        FORCE_STDIN: 'true'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }
    }, timeout);

    if (input && child.stdin) {
      // Write input with small delays to simulate real user interaction
      const lines = input.split('\n');
      let index = 0;
      
      const writeNext = () => {
        if (index < lines.length && child.stdin && !child.stdin.destroyed) {
          child.stdin.write(lines[index] + '\n');
          index++;
          if (index < lines.length) {
            setTimeout(writeNext, 100); // 100ms delay between inputs
          } else {
            child.stdin.end();
          }
        }
      };
      
      setTimeout(writeNext, 200); // Initial delay
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

describe('Complete User Workflow E2E', () => {
  const testHomeDir = path.join(os.tmpdir(), 'linear-cli-e2e-test');
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cli');
  
  beforeEach(async () => {
    // Build the project before each test
    await execCommand('npm run build');
    
    // Clean up any existing test config directories
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }
    
    // Create fresh test home directory
    fs.mkdirSync(testHomeDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test config after each test
    if (fs.existsSync(testHomeDir)) {
      fs.rmSync(testHomeDir, { recursive: true, force: true });
    }
  });

  it('should complete full workflow: add account → fetch real issue → get branch name', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E!;
    const testIssueId = process.env.LINEAR_TEST_ISSUE_ID!;
    
    // Step 1: Add account with real API key (using interactive mode)
    const accountName = `e2e-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${apiKey}`;
    const addResult = await execCommand('node dist/index.js account add', addAccountInput, 10000);
    
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('Account name');
    expect(addResult.stdout).toContain('Linear API key');

    // Step 2: List accounts to verify it was added
    const listResult = await execCommand('node dist/index.js account list');
    
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(accountName);
    expect(listResult.stdout).toContain('✅ Active');

    // Step 3: Fetch real issue details
    const showResult = await execCommand(`node dist/index.js issue show ${testIssueId}`);
    
    expect(showResult.exitCode).toBe(0);
    expect(showResult.stdout).toContain('🎯');
    expect(showResult.stdout).toContain('Status:');
    expect(showResult.stdout).toContain('Suggested Branch:');

    // Step 4: Get branch name for the issue
    const branchResult = await execCommand(`node dist/index.js issue branch ${testIssueId}`);
    
    expect(branchResult.exitCode).toBe(0);
    expect(branchResult.stdout.trim()).toMatch(/^[a-z]+-\d+\/[a-z0-9-]+$/);

    // Step 5: Test JSON output format (TODO: implement --format json flag)
    // const jsonResult = await execCommand(`node dist/index.js issue show ${testIssueId} --format json`);
    // expect(jsonResult.exitCode).toBe(0);
    // const issueData = JSON.parse(jsonResult.stdout);
    // expect(issueData).toHaveProperty('identifier');
  }, 60000); // 1 minute timeout for API calls

  it('should handle invalid API key gracefully', async () => {
    const invalidApiKey = 'invalid-api-key-12345';
    const accountName = `invalid-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${invalidApiKey}`;
    
    const result = await execCommand('node dist/index.js account add', addAccountInput, 10000);
    
    // Should still prompt for input but handle invalid key gracefully
    expect(result.stdout).toContain('Account name');
    expect(result.stdout).toContain('Linear API key');
  });

  it('should handle non-existent issue gracefully', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E!;
    
    // Add account first
    const accountName = `e2e-test-${Date.now()}`;
    const addAccountInput = `${accountName}\n${apiKey}`;
    await execCommand('node dist/index.js account add', addAccountInput, 10000);
    
    // Try to fetch non-existent issue
    const result = await execCommand('node dist/index.js issue show INVALID-999', undefined, 10000);
    
    // Should handle error gracefully - might return different exit codes
    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  });
});