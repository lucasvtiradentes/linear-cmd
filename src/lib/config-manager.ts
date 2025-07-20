import * as fs from 'fs';

import { userMetadataSchema, linearConfigSchema } from '../config.js';
import type { UserMetadata, LinearConfig, WorkspaceConfig, Account } from '../config.js';
import { CONFIG_PATHS } from './constants.js';
import { readJson5, writeJson5 } from './json-utils.js';

export class ConfigManager {
  private userMetadata: UserMetadata | null = null;
  private config: LinearConfig | null = null;

  constructor() {
    this.ensureConfigDirectory();
    this.initializeUserMetadata();
  }

  private ensureConfigDirectory(): void {
    if (!fs.existsSync(CONFIG_PATHS.configDir)) {
      fs.mkdirSync(CONFIG_PATHS.configDir, { recursive: true });
    }
  }

  private initializeUserMetadata(): void {
    if (!fs.existsSync(CONFIG_PATHS.userMetadataFile)) {
      this.createDefaultUserMetadata();
    }
    this.loadUserMetadata();
  }

  private createDefaultUserMetadata(): void {
    const defaultMetadata: UserMetadata = {
      config_path: CONFIG_PATHS.defaultConfigFile
    };
    writeJson5(CONFIG_PATHS.userMetadataFile, defaultMetadata);
  }

  private loadUserMetadata(): void {
    try {
      const data = readJson5<UserMetadata>(CONFIG_PATHS.userMetadataFile);
      const validated = userMetadataSchema.parse(data);
      this.userMetadata = validated;
    } catch (error) {
      throw new Error(`Failed to load user metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getConfigPath(): string {
    if (!this.userMetadata) {
      throw new Error('User metadata not loaded');
    }
    return this.userMetadata.config_path;
  }

  private loadConfig(): LinearConfig {
    if (this.config) {
      return this.config;
    }

    const configPath = this.getConfigPath();

    if (!fs.existsSync(configPath)) {
      this.createDefaultConfig();
    }

    try {
      const data = readJson5<LinearConfig>(configPath);
      const validated = linearConfigSchema.parse(data);
      this.config = validated;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createDefaultConfig(): void {
    const defaultConfig: LinearConfig = {
      workspaces: {},
      settings: {
        max_results: 50,
        date_format: 'relative',
        auto_update_workspaces: true
      }
    };

    const configPath = this.getConfigPath();
    writeJson5(configPath, defaultConfig);
  }

  private saveConfig(): void {
    if (!this.config) {
      throw new Error('No config to save');
    }

    const configPath = this.getConfigPath();
    writeJson5(configPath, this.config);
  }

  // Public API Methods

  async addWorkspace(name: string, apiKey: string, teamId?: string): Promise<void> {
    const config = this.loadConfig();

    if (config.workspaces[name]) {
      throw new Error(`Workspace '${name}' already exists`);
    }

    const workspaceConfig: WorkspaceConfig = {
      name,
      api_key: apiKey,
      team_id: teamId,
      default: Object.keys(config.workspaces).length === 0 // First workspace is default
    };

    config.workspaces[name] = workspaceConfig;

    // No longer set as active automatically

    this.saveConfig();
  }

  async removeWorkspace(name: string): Promise<void> {
    const config = this.loadConfig();

    if (!config.workspaces[name]) {
      throw new Error(`Workspace '${name}' not found`);
    }

    delete config.workspaces[name];

    // No longer manage active workspace

    this.saveConfig();
  }

  // Active workspace methods removed - accounts must be specified explicitly

  getAllWorkspaces(): WorkspaceConfig[] {
    const config = this.loadConfig();
    return Object.values(config.workspaces);
  }

  getWorkspace(name: string): WorkspaceConfig | null {
    const config = this.loadConfig();
    return config.workspaces[name] || null;
  }

  listWorkspaces(): Array<{ name: string; teamId?: string }> {
    const config = this.loadConfig();

    return Object.entries(config.workspaces).map(([name, workspace]) => ({
      name,
      teamId: workspace.team_id
    }));
  }

  updateWorkspaceApiKey(name: string, apiKey: string): void {
    const config = this.loadConfig();

    if (!config.workspaces[name]) {
      throw new Error(`Workspace '${name}' not found`);
    }

    config.workspaces[name].api_key = apiKey;
    this.saveConfig();
  }

  // Legacy methods for backward compatibility

  // getActiveAccount removed - accounts must be specified explicitly

  async getAllAccounts(): Promise<Account[]> {
    const workspaces = this.getAllWorkspaces();

    return workspaces.map((workspace) => ({
      id: workspace.name,
      name: workspace.name,
      apiKey: workspace.api_key,
      isActive: false,
      workspaces: workspace.workspaces
    }));
  }

  async listAccounts(): Promise<Account[]> {
    const accounts = await this.getAllAccounts();
    return accounts.map((account) => ({ ...account, apiKey: '***' }));
  }

  findAccountByWorkspace(workspace: string): Account | null {
    const workspaces = this.getAllWorkspaces();
    const found = workspaces.find((w) => w.workspaces?.includes(workspace));

    if (!found) {
      return null;
    }

    return {
      id: found.name,
      name: found.name,
      apiKey: found.api_key,
      isActive: false,
      workspaces: found.workspaces
    };
  }

  async updateAccountWorkspaces(accountId: string, workspaces: string[]): Promise<void> {
    const config = this.loadConfig();

    if (!config.workspaces[accountId]) {
      throw new Error(`Workspace '${accountId}' not found`);
    }

    config.workspaces[accountId].workspaces = workspaces;
    this.saveConfig();
  }

  // Alias methods for backward compatibility with "account" terminology
  async addAccount(name: string, apiKey: string): Promise<void> {
    return this.addWorkspace(name, apiKey);
  }

  async removeAccount(name: string): Promise<void> {
    return this.removeWorkspace(name);
  }
}
