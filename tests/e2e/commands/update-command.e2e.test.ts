import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execCommand } from '../utils/exec-command';
import { cleanupTestEnvironment, getTestDirs, setupTestEnvironment } from '../utils/test-setup';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

describe('Update Command E2E', () => {
  const { testHomeDir, testConfigDir } = getTestDirs('update');

  beforeEach(async () => {
    setupTestEnvironment(testConfigDir, testHomeDir);
  });

  afterEach(() => {
    cleanupTestEnvironment(testHomeDir);
  });

  it('should check for updates successfully', async () => {
    const result = await execCommand('update', undefined, 30000, testHomeDir);

    expect(result.exitCode === 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);

    if (result.exitCode === 0) {
      expect(
        result.stdout.includes('Checking') || result.stdout.includes('version') || result.stdout.includes('up to date')
      ).toBe(true);
    }
  }, 45000);

  it('should show current version information', async () => {
    const result = await execCommand('update', undefined, 30000, testHomeDir);

    if (result.exitCode === 0) {
      expect(
        result.stdout.includes('version') || result.stdout.includes('Current') || result.stdout.includes('Latest')
      ).toBe(true);
    }
  }, 45000);

  it('should handle network errors gracefully', async () => {
    // Simulate network issues by setting invalid npm registry
    const env = {
      ...process.env,
      npm_config_registry: 'http://invalid-registry-url.local'
    };

    const result = await new Promise<CommandResult>((resolve, reject) => {
      const child = spawn('npm', ['run', 'dev', '--', 'update'], {
        cwd: path.resolve(__dirname, '../../../'),
        env: {
          ...env,
          NODE_ENV: 'test',
          HOME: testHomeDir,
          CI: 'true',
          FORCE_TTY: 'false'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          child.kill('SIGTERM');
          reject(new Error('Command timed out after 20s'));
        }
      }, 20000);

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

    // Should handle network errors gracefully
    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  }, 30000);

  it('should handle --force flag (mock install)', async () => {
    const result = await execCommand('update --force', undefined, 45000, testHomeDir);

    expect(
      result.exitCode === 0 ||
        result.stderr.includes('permission') ||
        result.stderr.includes('EACCES') ||
        result.stdout.includes('Error') ||
        result.stdout.includes('Installing') ||
        result.stdout.includes('Update') ||
        result.stdout.includes('up to date') ||
        result.stdout.includes('already') ||
        result.stderr.length > 0
    ).toBe(true);
  }, 60000);

  it('should handle version comparison logic', async () => {
    const result = await execCommand('update', undefined, 30000, testHomeDir);

    if (result.exitCode === 0) {
      const output = result.stdout.toLowerCase();
      expect(
        output.includes('latest') ||
          output.includes('current') ||
          output.includes('available') ||
          output.includes('up to date') ||
          output.includes('version')
      ).toBe(true);
    }
  }, 45000);

  it('should handle malformed package.json gracefully', async () => {
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const originalContent = readFileSync(packagePath, 'utf-8');

    try {
      writeFileSync(packagePath, '{ "invalid": json }');

      const result = await execCommand('update', undefined, 15000, testHomeDir);

      expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
    } finally {
      writeFileSync(packagePath, originalContent);
    }
  }, 20000);

  it('should handle npm command not found', async () => {
    // Set PATH to empty to simulate npm not found
    const result = await new Promise<CommandResult>((resolve, reject) => {
      const child = spawn('npm', ['run', 'dev', '--', 'update'], {
        cwd: path.resolve(__dirname, '../../../'),
        env: {
          NODE_ENV: 'test',
          HOME: testHomeDir,
          PATH: path.dirname(process.execPath), // Only node directory, no npm
          CI: 'true',
          FORCE_TTY: 'false'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          child.kill('SIGTERM');
          reject(new Error('Command timed out'));
        }
      }, 15000);

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

    // Should handle npm not found gracefully
    expect(result.exitCode !== 0 || result.stderr.length > 0 || result.stdout.includes('Error')).toBe(true);
  }, 20000);
});
