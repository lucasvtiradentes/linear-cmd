import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface TestDirs {
  testHomeDir: string;
  testConfigDir: string;
}

export function getTestDirs(testName: string): TestDirs {
  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-${testName}-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  return { testHomeDir, testConfigDir };
}

export function setupTestEnvironment(testConfigDir: string, testHomeDir: string): void {
  if (existsSync(testHomeDir)) {
    rmSync(testHomeDir, { recursive: true, force: true });
  }

  mkdirSync(testConfigDir, { recursive: true });

  const userMetadataPath = path.join(testConfigDir, 'user_metadata.json');
  const configPath = path.join(testConfigDir, 'config.json5');

  writeFileSync(
    userMetadataPath,
    JSON.stringify({
      config_path: configPath
    })
  );

  writeFileSync(
    configPath,
    `{
  "accounts": {}
}`
  );
}

export function cleanupTestEnvironment(testHomeDir: string): void {
  if (existsSync(testHomeDir)) {
    rmSync(testHomeDir, { recursive: true, force: true });
  }
}
