import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigManager } from '../../../src/lib/config-manager';
import { LinearAPIClient } from '../../../src/lib/linear-client';

vi.mock('../../../src/lib/config-manager');

describe('LinearAPIClient', () => {
  let client: LinearAPIClient;
  let mockConfigManager: Pick<ConfigManager, 'getAllAccounts' | 'findAccountByWorkspace' | 'updateAccountWorkspaces'>;

  beforeEach(() => {
    mockConfigManager = {
      getAllAccounts: vi.fn().mockReturnValue([
        {
          name: 'work',
          api_key: 'work-api-key',
          workspaces: ['work_account']
        },
        {
          name: 'personal',
          api_key: 'personal-api-key',
          workspaces: ['personal_account']
        }
      ]),
      findAccountByWorkspace: vi.fn((workspace: string) => {
        if (workspace === 'work_account') {
          return { name: 'work', api_key: 'work-api-key', workspaces: ['work_account'] };
        }
        if (workspace === 'personal_account') {
          return { name: 'personal', api_key: 'personal-api-key', workspaces: ['personal_account'] };
        }
        return null;
      }) as ConfigManager['findAccountByWorkspace'],
      updateAccountWorkspaces: vi.fn()
    };

    vi.mocked(ConfigManager).mockImplementation(() => mockConfigManager as ConfigManager);
    client = new LinearAPIClient();
  });

  describe('parseIssueUrl', () => {
    it('should extract workspace and issue ID from URL', () => {
      const result = client.parseIssueUrl('https://linear.app/work_account/issue/WORK-123/test-issue');

      expect(result).toEqual({
        workspace: 'work_account',
        issueId: 'WORK-123'
      });
    });

    it('should handle issue ID directly', () => {
      const result = client.parseIssueUrl('WORK-123');

      expect(result).toEqual({
        workspace: null,
        issueId: 'WORK-123'
      });
    });
  });

  describe('generateBranchName', () => {
    it('should generate kebab-case branch name', () => {
      const result = client.generateBranchName('WORK-123', 'Test Issue: With Special Characters!');

      expect(result).toBe('work-123/test-issue-with-special-characters');
    });

    it('should truncate long titles', () => {
      const longTitle =
        'This is a very long issue title that should be truncated to avoid excessively long branch names';
      const result = client.generateBranchName('WORK-123', longTitle);

      expect(result.length).toBeLessThanOrEqual(60); // identifier + / + 50 chars max
      expect(result).toMatch(/^work-123\/this-is-a-very-long-issue-title-that-should-be/);
    });
  });

  describe('getIssueByIdOrUrl', () => {
    it('should fetch issue by URL with automatic account detection', async () => {
      const issue = await client.getIssueByIdOrUrl('https://linear.app/work_account/issue/WORK-123/test-issue');

      expect(issue).toBeDefined();
      expect(issue.identifier).toBe('WORK-123');
      expect(issue.title).toBe('Test Issue');
    });

    it('should fetch issue by ID trying all accounts', async () => {
      const issue = await client.getIssueByIdOrUrl('WORK-123');

      expect(issue).toBeDefined();
      expect(issue.identifier).toBe('WORK-123');
    });

    it('should handle pull request attachments', async () => {
      const issue = await client.getIssueByIdOrUrl('WORK-123');

      expect(issue.pullRequests).toHaveLength(1);
      expect(issue.pullRequests[0]).toMatchObject({
        url: 'https://github.com/test/repo/pull/123',
        title: 'Test PR',
        number: 123
      });
    });

    it('should throw error when no account can access the issue', async () => {
      vi.mocked(mockConfigManager.getAllAccounts).mockResolvedValue([]);

      await expect(client.getIssueByIdOrUrl('WORK-123')).rejects.toThrow('No accounts configured');
    });

    it('should update workspace cache when finding new workspace', async () => {
      // Simulate finding a new workspace
      vi.mocked(mockConfigManager.findAccountByWorkspace).mockReturnValue(null);

      await client.getIssueByIdOrUrl('https://linear.app/newworkspace/issue/NEW-123/test');

      expect(mockConfigManager.updateAccountWorkspaces).toHaveBeenCalled();
    });
  });
});
