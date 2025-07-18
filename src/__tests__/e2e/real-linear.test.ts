import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConfigManager } from '../../lib/config';
import { LinearAPIClient } from '../../lib/linear-client';
import { LinearClient } from '@linear/sdk';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Skip these tests if E2E is not configured
const skipE2E = process.env.SKIP_E2E_TESTS === 'true' || !process.env.LINEAR_TEST_API_KEY_WORK;

describe.skipIf(skipE2E)('E2E Tests with Real Linear API', () => {
  let configManager: ConfigManager;
  let tempConfigDir: string;
  
  // Test configuration from environment
  const testAccounts = {
    work: {
      apiKey: process.env.LINEAR_TEST_API_KEY_WORK!,
      issueId: process.env.LINEAR_TEST_ISSUE_WORK || 'WAY-1',
      issueUrl: process.env.LINEAR_TEST_ISSUE_URL_WORK
    },
    personal: {
      apiKey: process.env.LINEAR_TEST_API_KEY_PERSONAL!,
      issueId: process.env.LINEAR_TEST_ISSUE_PERSONAL || 'PERSONAL-1',
      issueUrl: process.env.LINEAR_TEST_ISSUE_URL_PERSONAL
    }
  };

  beforeAll(async () => {
    // Create temporary config directory for tests
    tempConfigDir = path.join(os.tmpdir(), `linear-cli-e2e-${Date.now()}`);
    process.env.HOME = tempConfigDir;
    
    // Initialize config manager with test accounts
    configManager = new ConfigManager();
    
    // Add test accounts if they have API keys
    if (testAccounts.work.apiKey) {
      await configManager.addAccount('work-test', testAccounts.work.apiKey);
    }
    if (testAccounts.personal.apiKey) {
      await configManager.addAccount('personal-test', testAccounts.personal.apiKey);
    }
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempConfigDir)) {
      fs.rmSync(tempConfigDir, { recursive: true, force: true });
    }
  });

  describe('Account Management', () => {
    it('should successfully connect to Linear with work account', async () => {
      if (!testAccounts.work.apiKey) {
        console.log('Skipping: No work API key provided');
        return;
      }

      const client = new LinearClient({ apiKey: testAccounts.work.apiKey });
      const viewer = await client.viewer;
      
      expect(viewer).toBeDefined();
      expect(viewer.email).toBeTruthy();
      console.log(`✅ Connected as: ${viewer.name} (${viewer.email})`);
    });

    it('should successfully connect to Linear with personal account', async () => {
      if (!testAccounts.personal.apiKey) {
        console.log('Skipping: No personal API key provided');
        return;
      }

      const client = new LinearClient({ apiKey: testAccounts.personal.apiKey });
      const viewer = await client.viewer;
      
      expect(viewer).toBeDefined();
      expect(viewer.email).toBeTruthy();
      console.log(`✅ Connected as: ${viewer.name} (${viewer.email})`);
    });
  });

  describe('Issue Fetching', () => {
    it('should fetch real work issue by ID', async () => {
      if (!testAccounts.work.apiKey) {
        console.log('Skipping: No work API key provided');
        return;
      }

      const client = new LinearAPIClient();
      const issue = await client.getIssueByIdOrUrl(testAccounts.work.issueId);
      
      expect(issue).toBeDefined();
      expect(issue.identifier).toBe(testAccounts.work.issueId);
      expect(issue.title).toBeTruthy();
      expect(issue.branchName).toBeTruthy();
      
      console.log(`✅ Fetched issue: ${issue.identifier} - ${issue.title}`);
      console.log(`   Branch: ${issue.branchName}`);
      console.log(`   State: ${issue.state.name}`);
    });

    it('should fetch real issue by URL with automatic account detection', async () => {
      if (!testAccounts.work.issueUrl) {
        console.log('Skipping: No work issue URL provided');
        return;
      }

      const client = new LinearAPIClient();
      const issue = await client.getIssueByIdOrUrl(testAccounts.work.issueUrl);
      
      expect(issue).toBeDefined();
      expect(issue.url).toBe(testAccounts.work.issueUrl);
      
      console.log(`✅ Auto-detected account for: ${issue.identifier}`);
    });
  });

  describe('Cross-Account Detection', () => {
    it('should automatically use correct account based on workspace', async () => {
      if (!testAccounts.work.apiKey || !testAccounts.personal.apiKey) {
        console.log('Skipping: Need both accounts configured');
        return;
      }

      const client = new LinearAPIClient();
      
      // Test work issue
      if (testAccounts.work.issueUrl) {
        const workIssue = await client.getIssueByIdOrUrl(testAccounts.work.issueUrl);
        expect(workIssue).toBeDefined();
        console.log(`✅ Work issue: ${workIssue.identifier}`);
      }
      
      // Test personal issue
      if (testAccounts.personal.issueUrl) {
        const personalIssue = await client.getIssueByIdOrUrl(testAccounts.personal.issueUrl);
        expect(personalIssue).toBeDefined();
        console.log(`✅ Personal issue: ${personalIssue.identifier}`);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid issue ID gracefully', async () => {
      const client = new LinearAPIClient();
      
      await expect(client.getIssueByIdOrUrl('INVALID-999999'))
        .rejects.toThrow();
    });

    it('should handle invalid API key', async () => {
      const client = new LinearClient({ apiKey: 'invalid-api-key' });
      
      await expect(client.viewer).rejects.toThrow();
    });
  });
});