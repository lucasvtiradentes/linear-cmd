import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createBranchIssueCommand } from '../../../src/commands/issue/branch-issue';
import { ConfigManager } from '../../../src/lib/config';
import { LinearAPIClient } from '../../../src/lib/linear-client';

vi.mock('../../../src/lib/linear-client');
vi.mock('../../../src/lib/config');

describe('Branch Issue Command Integration', () => {
  let mockLinearClient: any;
  let mockConfigManager: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() was called');
    });

    // Mock LinearAPIClient
    mockLinearClient = {
      getIssueByIdOrUrl: vi.fn()
    };
    vi.mocked(LinearAPIClient).mockImplementation(() => mockLinearClient);

    // Mock ConfigManager
    mockConfigManager = {
      getAllAccounts: vi.fn(),
      getActiveAccount: vi.fn()
    };
    vi.mocked(ConfigManager).mockImplementation(() => mockConfigManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return branch name for issue', async () => {
    const mockIssueData = {
      id: 'issue-123',
      identifier: 'WAY-123',
      title: 'Integration Test Issue',
      description: 'This is a test issue.',
      branchName: 'way-123/integration-test-issue',
      state: {
        name: 'In Progress',
        color: '#f59e0b'
      },
      assignee: {
        name: 'Integration Tester',
        email: 'tester@example.com'
      },
      labels: [],
      comments: [],
      pullRequests: [],
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-01-02T15:30:00Z'),
      url: 'https://linear.app/waytech/issue/WAY-123/test-issue'
    };

    mockLinearClient.getIssueByIdOrUrl.mockResolvedValue(mockIssueData);

    const command = createBranchIssueCommand();

    // Simulate command execution
    await command.parseAsync(['WAY-123'], { from: 'user' });

    expect(mockLinearClient.getIssueByIdOrUrl).toHaveBeenCalledWith('WAY-123');
    expect(consoleLogSpy).toHaveBeenCalledWith('way-123/integration-test-issue');
  });

  it('should handle Linear URL input', async () => {
    const mockIssueData = {
      id: 'issue-123',
      identifier: 'WAY-123',
      title: 'Integration Test Issue',
      description: 'This is a test issue.',
      branchName: 'way-123/integration-test-issue',
      state: {
        name: 'In Progress',
        color: '#f59e0b'
      },
      assignee: null,
      labels: [],
      comments: [],
      pullRequests: [],
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-01-02T15:30:00Z'),
      url: 'https://linear.app/waytech/issue/WAY-123/test-issue'
    };

    mockLinearClient.getIssueByIdOrUrl.mockResolvedValue(mockIssueData);

    const command = createBranchIssueCommand();

    // Simulate command execution with Linear URL
    await command.parseAsync(['https://linear.app/waytech/issue/WAY-123/test-issue'], { from: 'user' });

    expect(mockLinearClient.getIssueByIdOrUrl).toHaveBeenCalledWith('https://linear.app/waytech/issue/WAY-123/test-issue');
    expect(consoleLogSpy).toHaveBeenCalledWith('way-123/integration-test-issue');
  });

  it('should handle issue not found error', async () => {
    mockLinearClient.getIssueByIdOrUrl.mockRejectedValue(new Error('Entity not found: Issue - Could not find referenced Issue.'));

    const command = createBranchIssueCommand();

    // Expect process.exit to be called due to error
    await expect(async () => {
      await command.parseAsync(['NOTFOUND-123'], { from: 'user' });
    }).rejects.toThrow('process.exit() was called');

    expect(mockLinearClient.getIssueByIdOrUrl).toHaveBeenCalledWith('NOTFOUND-123');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Error fetching issue'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Entity not found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle missing required argument', async () => {
    const command = createBranchIssueCommand();

    // Expect error when no arguments provided
    await expect(async () => {
      await command.parseAsync([], { from: 'user' });
    }).rejects.toThrow();
  });
});
