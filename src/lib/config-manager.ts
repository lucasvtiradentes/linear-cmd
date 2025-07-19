import * as fs from 'fs';
import * as path from 'path';
import { CONFIG_PATHS, APP_INFO } from './constants';
import { readJson, writeJson, readJson5, writeJson5 } from './json-utils';
import { 
  userMetadataSchema, 
  linearConfigSchema
} from '../types/config';
import type { 
  UserMetadata, 
  LinearConfig, 
  WorkspaceConfig, 
  Account
} from '../types/config';

export class NewConfigManager {
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
      config_path: CONFIG_PATHS.defaultConfigFile,
    };
    writeJson(CONFIG_PATHS.userMetadataFile, defaultMetadata);
  }

  private loadUserMetadata(): void {
    try {
      const data = readJson<UserMetadata>(CONFIG_PATHS.userMetadataFile);
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
      $schema: CONFIG_PATHS.schemaUrl,
      workspaces: {},
      settings: {
        max_results: 50,
        date_format: 'relative',
        auto_update_workspaces: true,
      },
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
      default: Object.keys(config.workspaces).length === 0, // First workspace is default
    };

    config.workspaces[name] = workspaceConfig;
    
    // Set as active if it's the first one
    if (Object.keys(config.workspaces).length === 1) {
      this.setActiveWorkspace(name);
    }
    
    this.saveConfig();
  }

  async removeWorkspace(name: string): Promise<void> {
    const config = this.loadConfig();
    
    if (!config.workspaces[name]) {
      throw new Error(`Workspace '${name}' not found`);
    }

    delete config.workspaces[name];
    
    // If removed workspace was active, set new active
    if (this.userMetadata?.active_workspace === name) {
      const remainingWorkspaces = Object.keys(config.workspaces);
      if (remainingWorkspaces.length > 0) {
        this.setActiveWorkspace(remainingWorkspaces[0]);
      } else {
        this.clearActiveWorkspace();
      }
    }
    
    this.saveConfig();
  }

  setActiveWorkspace(name: string): void {
    const config = this.loadConfig();
    
    if (!config.workspaces[name]) {
      throw new Error(`Workspace '${name}' not found`);
    }

    if (!this.userMetadata) {
      throw new Error('User metadata not loaded');
    }

    this.userMetadata.active_workspace = name;
    writeJson(CONFIG_PATHS.userMetadataFile, this.userMetadata);
  }

  private clearActiveWorkspace(): void {
    if (!this.userMetadata) {
      throw new Error('User metadata not loaded');
    }

    delete this.userMetadata.active_workspace;
    writeJson(CONFIG_PATHS.userMetadataFile, this.userMetadata);
  }

  getActiveWorkspace(): WorkspaceConfig | null {
    const config = this.loadConfig();
    
    if (!this.userMetadata?.active_workspace) {
      return null;
    }
    
    const workspace = config.workspaces[this.userMetadata.active_workspace];
    return workspace || null;
  }

  getAllWorkspaces(): WorkspaceConfig[] {
    const config = this.loadConfig();
    return Object.values(config.workspaces);
  }

  getWorkspace(name: string): WorkspaceConfig | null {
    const config = this.loadConfig();
    return config.workspaces[name] || null;
  }

  listWorkspaces(): Array<{ name: string; active: boolean; teamId?: string }> {
    const config = this.loadConfig();
    const activeWorkspace = this.userMetadata?.active_workspace;
    
    return Object.entries(config.workspaces).map(([name, workspace]) => ({
      name,
      active: name === activeWorkspace,
      teamId: workspace.team_id,
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
  
  async getActiveAccount(): Promise<Account | null> {
    const workspace = this.getActiveWorkspace();
    if (!workspace) {
      return null;
    }

    return {
      id: workspace.name,
      name: workspace.name,
      apiKey: workspace.api_key,
      isActive: true,
      workspaces: workspace.workspaces,
    };
  }

  async getAllAccounts(): Promise<Account[]> {
    const workspaces = this.getAllWorkspaces();
    const activeWorkspace = this.userMetadata?.active_workspace;
    
    return workspaces.map(workspace => ({
      id: workspace.name,
      name: workspace.name,
      apiKey: workspace.api_key,
      isActive: workspace.name === activeWorkspace,
      workspaces: workspace.workspaces,
    }));
  }

  listAccounts(): Account[] {
    return this.getAllAccounts().then(accounts => 
      accounts.map(account => ({ ...account, apiKey: '***' }))
    ) as any; // Type hack for legacy sync method
  }

  findAccountByWorkspace(workspace: string): Account | null {
    const workspaces = this.getAllWorkspaces();
    const found = workspaces.find(w => w.workspaces?.includes(workspace));
    
    if (!found) {
      return null;
    }

    return {
      id: found.name,
      name: found.name,
      apiKey: found.api_key,
      isActive: found.name === this.userMetadata?.active_workspace,
      workspaces: found.workspaces,
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
}