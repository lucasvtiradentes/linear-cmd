import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinearAPIClient } from '../../../lib/linear-client';
import { ConfigManager } from '../../../lib/config';

vi.mock('../../../lib/config');

describe('LinearAPIClient', () => {
  let client: LinearAPIClient;
  let mockConfigManager: any;

  beforeEach(() => {
    mockConfigManager = {
      getAllAccounts: vi.fn().mockResolvedValue([
        {
          id: 'work-123',
          name: 'work',
          apiKey: 'work-api-key',
          workspaces: ['waytech']
        },
        {
          id: 'personal-456',
          name: 'personal',
          apiKey: 'personal-api-key',
          workspaces: ['lucasvtiradentes']
        }
      ]),
      findAccountByWorkspace: vi.fn((workspace: string) => {
        if (workspace === 'waytech') {
          return { id: 'work-123', name: 'work', workspaces: ['waytech'] };
        }
        if (workspace === 'lucasvtiradentes') {
          return { id: 'personal-456', name: 'personal', workspaces: ['lucasvtiradentes'] };
        }
        return null;
      }),
      updateAccountWorkspaces: vi.fn(),
      getActiveAccount: vi.fn().mockResolvedValue({
        id: 'work-123',
        name: 'work',
        apiKey: 'work-api-key'
      })
    };
    
    vi.mocked(ConfigManager).mockImplementation(() => mockConfigManager);
    client = new LinearAPIClient();
  });

  describe('parseIssueUrl', () => {
    it('should extract workspace and issue ID from URL', () => {
      const result = (client as any).parseIssueUrl(
        'https://linear.app/waytech/issue/WAY-123/test-issue'
      );
      
      expect(result).toEqual({
        workspace: 'waytech',
        issueId: 'WAY-123'
      });
    });

    it('should handle issue ID directly', () => {
      const result = (client as any).parseIssueUrl('WAY-123');
      
      expect(result).toEqual({
        workspace: null,
        issueId: 'WAY-123'
      });
    });
  });

  describe('generateBranchName', () => {
    it('should generate kebab-case branch name', () => {
      const result = (client as any).generateBranchName(
        'WAY-123',
        'Test Issue: With Special Characters!'
      );
      
      expect(result).toBe('way-123/test-issue-with-special-characters');
    });

    it('should truncate long titles', () => {
      const longTitle = 'This is a very long issue title that should be truncated to avoid excessively long branch names';
      const result = (client as any).generateBranchName('WAY-123', longTitle);
      
      expect(result.length).toBeLessThanOrEqual(60); // identifier + / + 50 chars max
      expect(result).toMatch(/^way-123\/this-is-a-very-long-issue-title-that-should-be/);
    });
  });

  describe('getIssueByIdOrUrl', () => {
    it('should fetch issue by URL with automatic account detection', async () => {
      const issue = await client.getIssueByIdOrUrl(
        'https://linear.app/waytech/issue/WAY-123/test-issue'
      );
      
      expect(issue).toBeDefined();
      expect(issue.identifier).toBe('WAY-123');
      expect(issue.title).toBe('Test Issue');
      expect(issue.branchName).toBe('way-123/test-issue');
    });

    it('should fetch issue by ID trying all accounts', async () => {
      const issue = await client.getIssueByIdOrUrl('WAY-123');
      
      expect(issue).toBeDefined();
      expect(issue.identifier).toBe('WAY-123');
    });

    it('should handle pull request attachments', async () => {
      const issue = await client.getIssueByIdOrUrl('WAY-123');
      
      expect(issue.pullRequests).toHaveLength(1);
      expect(issue.pullRequests[0]).toMatchObject({
        url: 'https://github.com/test/repo/pull/123',
        title: 'Test PR',
        number: 123
      });
    });

    it('should throw error when no account can access the issue', async () => {
      mockConfigManager.getAllAccounts.mockResolvedValue([]);
      
      await expect(client.getIssueByIdOrUrl('WAY-123'))
        .rejects.toThrow('No accounts configured');
    });

    it('should update workspace cache when finding new workspace', async () => {
      // Simulate finding a new workspace
      mockConfigManager.findAccountByWorkspace.mockReturnValue(null);
      
      await client.getIssueByIdOrUrl(
        'https://linear.app/newworkspace/issue/NEW-123/test'
      );
      
      expect(mockConfigManager.updateAccountWorkspaces).toHaveBeenCalled();
    });
  });
});