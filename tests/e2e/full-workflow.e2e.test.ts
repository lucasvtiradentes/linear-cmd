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

async function execCommand(command: string, input?: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd: path.resolve(__dirname, '../../'),
      env: { 
        ...process.env, 
        NODE_ENV: 'e2e',
        // Use test config directory to avoid conflicts
        HOME: path.join(os.tmpdir(), 'linear-cli-e2e-test')
      },
      stdio: input ? 'pipe' : 'inherit'
    });

    let stdout = '';
    let stderr = '';

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0
      });
    });
  });
}

describe('Complete User Workflow E2E', () => {
  const testConfigDir = path.join(os.tmpdir(), 'linear-cli-e2e-test', '.linear-cmd');
  
  beforeEach(async () => {
    // Build the project before each test
    await execCommand('npm run build');
    
    // Clean up any existing test config
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test config after each test
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  it('should complete full workflow: add account → fetch real issue → get branch name', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E!;
    const testIssueId = process.env.LINEAR_TEST_ISSUE_ID!;
    
    // Step 1: Add account with real API key
    const addAccountInput = `e2e-test\n${apiKey}\n`;
    const addResult = await execCommand('node dist/index.js account add', addAccountInput);
    
    expect(addResult.exitCode).toBe(0);
    expect(addResult.stdout).toContain('✅ Account "e2e-test" added successfully');
    expect(addResult.stdout).toContain('Connected as:');

    // Step 2: List accounts to verify it was added
    const listResult = await execCommand('node dist/index.js account list');
    
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain('e2e-test');
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

    // Step 5: Test JSON output format
    const jsonResult = await execCommand(`node dist/index.js issue show ${testIssueId} --format json`);
    
    expect(jsonResult.exitCode).toBe(0);
    const issueData = JSON.parse(jsonResult.stdout);
    expect(issueData).toHaveProperty('identifier');
    expect(issueData).toHaveProperty('title');
    expect(issueData).toHaveProperty('branchName');
    expect(issueData).toHaveProperty('state');
  }, 60000); // 1 minute timeout for API calls

  it('should handle invalid API key gracefully', async () => {
    const invalidApiKey = 'invalid-api-key-12345';
    const addAccountInput = `invalid-test\n${invalidApiKey}\n`;
    
    const result = await execCommand('node dist/index.js account add', addAccountInput);
    
    expect(result.exitCode).toBe(0); // Command runs but shows error
    expect(result.stderr).toContain('❌ Error adding account');
    expect(result.stderr).toContain('Please check your API key');
  });

  it('should handle non-existent issue gracefully', async () => {
    const apiKey = process.env.LINEAR_API_KEY_E2E!;
    
    // Add account first
    const addAccountInput = `e2e-test\n${apiKey}\n`;
    await execCommand('node dist/index.js account add', addAccountInput);
    
    // Try to fetch non-existent issue
    const result = await execCommand('node dist/index.js issue show INVALID-999');
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('❌ Error fetching issue');
  });
});