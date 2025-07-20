import { LinearClient } from '@linear/sdk';

import type { IssueData, Account } from '../config.js';
import { ConfigManager } from './config-manager.js';

export class LinearAPIClient {
  private client: LinearClient | null = null;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  async initialize(accountName?: string): Promise<void> {
    if (!accountName) {
      throw new Error('Account name is required. Please specify which account to use.');
    }

    const workspace = this.configManager.getWorkspace(accountName);
    if (!workspace) {
      throw new Error(`Account '${accountName}' not found. Please check your accounts using "linear account list"`);
    }

    this.client = new LinearClient({
      apiKey: workspace.api_key
    });
  }

  private ensureClient(): LinearClient {
    if (!this.client) {
      throw new Error('Linear client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  async getIssueByIdOrUrl(idOrUrl: string): Promise<IssueData> {
    // Extract workspace and issue ID from URL
    const { workspace, issueId } = this.parseIssueUrl(idOrUrl);

    // Try to find the right account for this workspace
    const account = await this.findAccountForWorkspace(workspace, issueId);

    if (!account) {
      throw new Error(`No account found that can access this issue. Please check your accounts and API keys.`);
    }

    // Initialize client with the correct account
    const client = new LinearClient({ apiKey: account.apiKey });

    // Fetch issue with all related data
    const issue = await client.issue(issueId);
    const [state, assignee, labels, comments] = await Promise.all([issue.state, issue.assignee, issue.labels(), issue.comments()]);

    // Generate suggested branch name
    const branchName = this.generateBranchName(issue.identifier, issue.title);

    // Fetch pull requests if available
    const pullRequests: IssueData['pullRequests'] = [];
    try {
      const attachments = await issue.attachments();
      for (const attachment of attachments.nodes) {
        if (attachment.url && attachment.url.includes('github.com') && attachment.url.includes('/pull/')) {
          // Extract PR info from GitHub URL
          const prMatch = attachment.url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
          if (prMatch) {
            pullRequests.push({
              id: attachment.id,
              url: attachment.url,
              title: attachment.title || 'Pull Request',
              number: parseInt(prMatch[2]),
              draft: false, // Can't determine from Linear
              merged: false, // Can't determine from Linear
              branch: 'unknown'
            });
          }
        }
      }
    } catch (error) {
      // Attachments might not be available
    }

    // Build issue data
    const issueData: IssueData = {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      branchName,
      state: {
        name: state?.name || 'Unknown',
        color: state?.color || '#000000'
      },
      assignee: assignee
        ? {
            name: assignee.name,
            email: assignee.email
          }
        : undefined,
      labels: labels.nodes.map((label) => ({
        name: label.name,
        color: label.color
      })),
      comments: await Promise.all(
        comments.nodes.map(async (comment) => {
          const user = await comment.user;
          return {
            id: comment.id,
            body: comment.body,
            user: {
              name: user?.name || 'Unknown',
              email: user?.email || ''
            },
            createdAt: comment.createdAt
          };
        })
      ),
      pullRequests,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      url: issue.url
    };

    return issueData;
  }

  private async findAccountForWorkspace(workspace: string | null, issueId: string): Promise<Account | null> {
    const accounts = await this.configManager.getAllAccounts();

    if (!accounts.length) {
      throw new Error('No accounts configured. Please add an account first using "linear account add"');
    }

    // If we have a workspace, try to find an account that has access to it
    if (workspace) {
      const accountByWorkspace = this.configManager.findAccountByWorkspace(workspace);
      if (accountByWorkspace) {
        return accountByWorkspace;
      }
    }

    // Try each account until we find one that can access this issue
    for (const account of accounts) {
      try {
        const client = new LinearClient({ apiKey: account.apiKey });
        await client.issue(issueId);

        // Update workspace cache for this account
        if (workspace && !account.workspaces?.includes(workspace)) {
          const workspaces = account.workspaces || [];
          workspaces.push(workspace);
          await this.configManager.updateAccountWorkspaces(account.id, workspaces);
        }

        return account;
      } catch (error) {
        // This account doesn't have access to this issue, try next one
        continue;
      }
    }

    return null;
  }

  public parseIssueUrl(idOrUrl: string): { workspace: string | null; issueId: string } {
    // If it's a URL, extract workspace and issue identifier
    const urlMatch = idOrUrl.match(/linear\.app\/([^/]+)\/issue\/([A-Z]+-\d+)/);
    if (urlMatch) {
      return {
        workspace: urlMatch[1],
        issueId: urlMatch[2]
      };
    }

    // Otherwise, assume it's already an issue identifier
    return {
      workspace: null,
      issueId: idOrUrl
    };
  }

  public generateBranchName(identifier: string, title: string): string {
    // Convert title to kebab-case
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Truncate if too long
    const maxLength = 50;
    const truncatedTitle = cleanTitle.length > maxLength ? cleanTitle.substring(0, maxLength).replace(/-$/, '') : cleanTitle;

    return `${identifier.toLowerCase()}/${truncatedTitle}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = this.ensureClient();
      await client.viewer;
      return true;
    } catch (error) {
      return false;
    }
  }
}
