import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { createShowIssueCommand } from '../../../src/commands/issue/show-issue';
import { ConfigManager } from '../../../src/lib/config-manager';
import { LinearAPIClient } from '../../../src/lib/linear-client';

vi.mock('../../../src/lib/linear-client');
vi.mock('../../../src/lib/config-manager');

describe('Show Issue Command Integration', () => {
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

  it('should show issue with formatted output', async () => {
    const mockIssueData = {
      id: 'issue-123',
      identifier: 'WAY-123',
      title: 'Integration Test Issue',
      description: 'This is a **test** issue with `code` and more content.',
      branchName: 'way-123/integration-test-issue',
      state: {
        name: 'In Progress',
        color: '#f59e0b'
      },
      assignee: {
        name: 'Integration Tester',
        email: 'tester@example.com'
      },
      labels: [
        { name: 'Feature', color: '#10b981' },
        { name: 'High Priority', color: '#ef4444' }
      ],
      comments: [],
      pullRequests: [
        {
          id: 'pr-1',
          url: 'https://github.com/test/repo/pull/456',
          title: 'Fix integration issues',
          number: 456,
          draft: false,
          merged: false,
          branch: 'feature/integration'
        }
      ],
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-01-02T15:30:00Z'),
      url: 'https://linear.app/waytech/issue/WAY-123/test-issue'
    };

    mockLinearClient.getIssueByIdOrUrl.mockResolvedValue(mockIssueData);

    const command = createShowIssueCommand();

    // Simulate command execution
    await command.parseAsync(['WAY-123'], { from: 'user' });

    expect(mockLinearClient.getIssueByIdOrUrl).toHaveBeenCalledWith('WAY-123');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Fetching issue details...'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🎯 WAY-123: Integration Test Issue'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Status: In Progress'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Assignee: Integration Tester'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('way-123/integration-test-issue'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Feature, High Priority'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Pull Requests:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔄 Open #456'));
  });

  it('should show issue in JSON format', async () => {
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
      labels: [{ name: 'Feature', color: '#10b981' }],
      comments: [],
      pullRequests: [],
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-01-02T15:30:00Z'),
      url: 'https://linear.app/waytech/issue/WAY-123/test-issue'
    };

    mockLinearClient.getIssueByIdOrUrl.mockResolvedValue(mockIssueData);

    const command = createShowIssueCommand();

    // Simulate command execution with JSON format
    await command.parseAsync(['WAY-123', '--format', 'json'], { from: 'user' });

    expect(mockLinearClient.getIssueByIdOrUrl).toHaveBeenCalledWith('WAY-123');

    // Check that JSON was logged
    const jsonOutput = consoleLogSpy.mock.calls.find((call) => call[0].includes('"identifier": "WAY-123"'));
    expect(jsonOutput).toBeDefined();

    // Parse and validate JSON structure
    const loggedJson = consoleLogSpy.mock.calls
      .filter((call) => call[0].startsWith('{') || call[0].includes('"identifier"'))
      .map((call) => call[0])
      .join('');

    if (loggedJson) {
      const parsedData = JSON.parse(loggedJson);
      expect(parsedData).toMatchObject({
        identifier: 'WAY-123',
        title: 'Integration Test Issue',
        branchName: 'way-123/integration-test-issue',
        state: {
          name: 'In Progress',
          color: '#f59e0b'
        }
      });
    }
  });

  it('should handle issue not found error', async () => {
    mockLinearClient.getIssueByIdOrUrl.mockRejectedValue(new Error('Entity not found: Issue - Could not find referenced Issue.'));

    const command = createShowIssueCommand();

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
    const command = createShowIssueCommand();

    // Expect error when no arguments provided
    await expect(async () => {
      await command.parseAsync([], { from: 'user' });
    }).rejects.toThrow();
  });
});
