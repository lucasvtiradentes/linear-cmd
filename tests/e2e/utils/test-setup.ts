import fs from 'fs';
import os from 'os';
import path from 'path';

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
}

export function cleanupTestEnvironment(testHomeDir: string): void {
  if (fs.existsSync(testHomeDir)) {
    fs.rmSync(testHomeDir, { recursive: true, force: true });
  }
}
