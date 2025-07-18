import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, Account } from '../types';
import * as keytar from 'keytar';

const CONFIG_DIR = path.join(os.homedir(), '.linear-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const SERVICE_NAME = 'linear-cli';

export class ConfigManager {
  private config: Config;

  constructor() {
    this.ensureConfigDir();
    this.config = this.loadConfig();
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  private loadConfig(): Config {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return { accounts: [] };
  }

  private saveConfig(): void {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  async addAccount(name: string, apiKey: string): Promise<void> {
    const id = `${name}-${Date.now()}`;
    
    // Store API key securely
    await keytar.setPassword(SERVICE_NAME, id, apiKey);
    
    const account: Account = {
      id,
      name,
      apiKey: '', // Don't store in config file
      isActive: this.config.accounts.length === 0,
      workspaces: []
    };

    this.config.accounts.push(account);
    
    if (account.isActive) {
      this.config.activeAccountId = account.id;
    }
    
    this.saveConfig();
  }

  async getActiveAccount(): Promise<Account | null> {
    if (!this.config.activeAccountId) {
      return null;
    }

    const account = this.config.accounts.find(a => a.id === this.config.activeAccountId);
    if (!account) {
      return null;
    }

    // Retrieve API key from secure storage
    const apiKey = await keytar.getPassword(SERVICE_NAME, account.id);
    if (!apiKey) {
      throw new Error(`API key not found for account ${account.name}`);
    }

    return { ...account, apiKey };
  }

  async switchAccount(accountName: string): Promise<void> {
    const account = this.config.accounts.find(a => a.name === accountName);
    if (!account) {
      throw new Error(`Account '${accountName}' not found`);
    }

    // Update active status
    this.config.accounts.forEach(a => {
      a.isActive = a.id === account.id;
    });
    this.config.activeAccountId = account.id;
    
    this.saveConfig();
  }

  async removeAccount(accountName: string): Promise<void> {
    const accountIndex = this.config.accounts.findIndex(a => a.name === accountName);
    if (accountIndex === -1) {
      throw new Error(`Account '${accountName}' not found`);
    }

    const account = this.config.accounts[accountIndex];
    
    // Remove API key from secure storage
    await keytar.deletePassword(SERVICE_NAME, account.id);
    
    // Remove from config
    this.config.accounts.splice(accountIndex, 1);
    
    // Update active account if necessary
    if (this.config.activeAccountId === account.id) {
      if (this.config.accounts.length > 0) {
        this.config.activeAccountId = this.config.accounts[0].id;
        this.config.accounts[0].isActive = true;
      } else {
        this.config.activeAccountId = undefined;
      }
    }
    
    this.saveConfig();
  }

  listAccounts(): Account[] {
    return this.config.accounts.map(a => ({ ...a, apiKey: '***' }));
  }

  async getAllAccounts(): Promise<Account[]> {
    const accounts: Account[] = [];
    
    for (const account of this.config.accounts) {
      const apiKey = await keytar.getPassword(SERVICE_NAME, account.id);
      if (apiKey) {
        accounts.push({ ...account, apiKey });
      }
    }
    
    return accounts;
  }

  async updateAccountWorkspaces(accountId: string, workspaces: string[]): Promise<void> {
    const account = this.config.accounts.find(a => a.id === accountId);
    if (account) {
      account.workspaces = workspaces;
      this.saveConfig();
    }
  }

  findAccountByWorkspace(workspace: string): Account | null {
    return this.config.accounts.find(a => a.workspaces?.includes(workspace)) || null;
  }
}