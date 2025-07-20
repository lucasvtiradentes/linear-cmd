import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createListAccountsCommand } from '../../../src/commands/account/list-accounts';
import { ConfigManager } from '../../../src/lib/config-manager';

vi.mock('../../../src/lib/config-manager');

describe('Account Commands Integration', () => {
  let mockConfigManager: any;
  let consoleLogSpy: any;
  let _consoleErrorSpy: any;
  let _processExitSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    _consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    _processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit() was called');
    });

    mockConfigManager = {
      getAllAccounts: vi.fn().mockReturnValue([]),
      getAccount: vi.fn(),
      addAccount: vi.fn(),
      removeAccount: vi.fn()
    };

    vi.mocked(ConfigManager).mockImplementation(() => mockConfigManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('List Accounts Command', () => {
    it('should list all accounts with details', async () => {
      const mockAccounts = [
        {
          name: 'work-account',
          api_key: 'lin_api_work123',
          workspaces: ['work_workspace', 'shared_workspace']
        },
        {
          name: 'personal-account',
          api_key: 'lin_api_personal456',
          workspaces: ['personal_workspace']
        }
      ];

      mockConfigManager.getAllAccounts.mockReturnValue(mockAccounts);

      const command = createListAccountsCommand();

      await command.parseAsync([], { from: 'user' });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configured accounts:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('work-account'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('personal-account'));
    });

    it('should show message when no accounts configured', async () => {
      mockConfigManager.getAllAccounts.mockReturnValue([]);

      const command = createListAccountsCommand();

      await command.parseAsync([], { from: 'user' });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No accounts configured'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('linear account add'));
    });

    it('should handle accounts without workspaces', async () => {
      const mockAccounts = [
        {
          name: 'simple-account',
          api_key: 'lin_api_simple123'
        }
      ];

      mockConfigManager.getAllAccounts.mockReturnValue(mockAccounts);

      const command = createListAccountsCommand();

      await command.parseAsync([], { from: 'user' });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configured accounts:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('simple-account'));
    });
  });
});
