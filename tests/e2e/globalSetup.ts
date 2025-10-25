import './load-env';

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { clearGlobalFixtures, loadGlobalFixtures, saveGlobalFixtures } from './global-fixtures';
import { e2eEnv } from './utils/e2e-env';
import { execCommand } from './utils/exec-command';

export async function setup() {
  const apiKey = e2eEnv.LINEAR_API_KEY_E2E;
  const testTeam = e2eEnv.LINEAR_TEST_TEAM;

  console.log('🌍 Creating global fixtures for all E2E tests...');

  const testHomeDir = path.join(os.tmpdir(), `linear-cmd-global-e2e-${Date.now()}`);
  const testConfigDir = path.join(testHomeDir, '.config', 'linear-cmd');

  try {
    // Setup test home directory
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

    console.log({ testHomeDir });

    // Setup test account
    const accountName = `e2e-global-${Date.now()}`;
    const addResult = await execCommand(
      `account add --name "${accountName}" --api-key "${apiKey}"`,
      undefined,
      15000,
      testHomeDir
    );

    if (addResult.exitCode !== 0) {
      console.error('Account add failed:');
      console.error('Exit code:', addResult.exitCode);
      console.error('Stdout:', addResult.stdout);
      console.error('Stderr:', addResult.stderr);
      throw new Error('Failed to create test account');
    }

    console.log('  ✓ Created test account');

    // Create test project
    const projectName = `E2E-Global-Project-${Date.now()}`;
    const projectResult = await execCommand(
      `project create -a ${accountName} --team ${testTeam} --name "${projectName}" --description "Global E2E test project - DO NOT DELETE MANUALLY"`,
      undefined,
      30000,
      testHomeDir
    );

    const projectUrlMatch = projectResult.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
    const projectUrl = projectUrlMatch ? projectUrlMatch[0] : null;

    if (!projectUrl) {
      console.error('Project creation failed:');
      console.error('Exit code:', projectResult.exitCode);
      console.error('Stdout:', projectResult.stdout);
      console.error('Stderr:', projectResult.stderr);
      throw new Error('Failed to create test project');
    }

    console.log('  ✓ Created test project');

    // Create test document
    const documentTitle = `E2E Global Document ${Date.now()}`;
    const documentResult = await execCommand(
      `document add -a ${accountName} --title "${documentTitle}" --content "Global test document - DO NOT DELETE MANUALLY" --project ${projectUrl}`,
      undefined,
      30000,
      testHomeDir
    );

    const documentUrlMatch = documentResult.stdout.match(/https:\/\/linear\.app\/[^\s]+/);
    const documentUrl = documentUrlMatch ? documentUrlMatch[0] : null;

    if (!documentUrl) {
      throw new Error('Failed to create test document');
    }

    console.log('  ✓ Created test document');

    // Create test issue
    const issueResult = await execCommand(
      `issue create -a ${accountName} --team ${testTeam} --title "E2E Global Issue ${Date.now()}" --description "Global test issue - DO NOT DELETE MANUALLY" --project ${projectUrl}`,
      undefined,
      30000,
      testHomeDir
    );

    // Match only the issue URL (not project URL)
    const issueUrlMatch = issueResult.stdout.match(/https:\/\/linear\.app\/[^/]+\/issue\/[^\s'"]+/);
    const issueUrl = issueUrlMatch ? issueUrlMatch[0] : null;

    if (!issueUrl) {
      throw new Error('Failed to create test issue');
    }

    console.log('  ✓ Created test issue');

    // Save fixtures
    saveGlobalFixtures({
      projectUrl,
      documentUrl,
      issueUrl,
      accountName,
      testHomeDir
    });

    console.log('✅ Global fixtures created successfully\n');
  } catch (error) {
    console.error('❌ Failed to create global fixtures:', error);
    // Clean up partial setup
    if (existsSync(testHomeDir)) {
      rmSync(testHomeDir, { recursive: true, force: true });
    }
    clearGlobalFixtures();
    console.log('⚠️  Tests will run without global fixtures (slower)\n');
  }
}

export async function teardown() {
  console.log('\n🧹 Cleaning up global fixtures...');

  try {
    const fixtures = loadGlobalFixtures();

    if (!fixtures) {
      console.log('⚠️  No global fixtures to clean up');
      return;
    }

    const { projectUrl, documentUrl, issueUrl, accountName, testHomeDir } = fixtures;

    // Delete document
    if (documentUrl) {
      await execCommand(`document delete ${documentUrl} --yes`, undefined, 30000, testHomeDir);
      console.log('  ✓ Deleted test document');
    }

    if (issueUrl) {
      console.log('  ⚠️  Issue cleanup skipped (no delete API available)');
    }

    // Delete project
    if (projectUrl) {
      await execCommand(`project delete ${projectUrl} -a ${accountName} --yes`, undefined, 30000, testHomeDir);
      console.log('  ✓ Deleted test project');
    }

    // Clean up test home directory
    if (existsSync(testHomeDir)) {
      rmSync(testHomeDir, { recursive: true, force: true });
      console.log('  ✓ Cleaned up test directory');
    }

    // Clear fixtures file
    clearGlobalFixtures();

    console.log('✅ Global fixtures cleaned up successfully\n');
  } catch (error) {
    console.error('❌ Failed to clean up global fixtures:', error);
    console.error('You may need to manually delete test resources in Linear');
  }

  console.log('🧹 E2E tests completed\n');
}
