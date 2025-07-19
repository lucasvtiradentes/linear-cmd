// Legacy ConfigManager that wraps the new implementation
// This maintains backward compatibility while using the new config system

import { NewConfigManager } from './config-manager.js';
import type { Account, Config } from '../types/index.js';

export const APP_NAME = 'linear-cli';

/**
 * @deprecated Use NewConfigManager directly for new code
 * This class exists for backward compatibility
 */
export class ConfigManager {
  private newManager: NewConfigManager;

  constructor() {
    this.newManager = new NewConfigManager();
  }

  async addAccount(name: string, apiKey: string): Promise<void> {
    return this.newManager.addWorkspace(name, apiKey);
  }

  async getActiveAccount(): Promise<Account | null> {
    return this.newManager.getActiveAccount();
  }

  async switchAccount(accountName: string): Promise<void> {
    this.newManager.setActiveWorkspace(accountName);
  }

  async removeAccount(accountName: string): Promise<void> {
    return this.newManager.removeWorkspace(accountName);
  }

  listAccounts(): Account[] {
    const workspaces = this.newManager.getAllWorkspaces();
    const activeWorkspace = this.newManager.getActiveWorkspace();
    
    return workspaces.map(workspace => ({
      id: workspace.name,
      name: workspace.name,
      apiKey: '***', // Hide API key in list
      isActive: workspace.name === activeWorkspace?.name,
      workspaces: workspace.workspaces,
    }));
  }

  async getAllAccounts(): Promise<Account[]> {
    return this.newManager.getAllAccounts();
  }

  async updateAccountWorkspaces(accountId: string, workspaces: string[]): Promise<void> {
    return this.newManager.updateAccountWorkspaces(accountId, workspaces);
  }

  findAccountByWorkspace(workspace: string): Account | null {
    return this.newManager.findAccountByWorkspace(workspace);
  }
}

// Export the new manager for direct use
export { NewConfigManager } from './config-manager.js';
export { CONFIG_PATHS, APP_INFO } from './constants.js';