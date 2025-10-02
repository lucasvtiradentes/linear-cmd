import { LinearClient } from '@linear/sdk';
import chalk from 'chalk';

import type { Account, DocumentData, IssueData, ProjectData, ProjectIssueData } from '../types/local.js';
import { ConfigManager } from './config-manager.js';
import { Logger } from './logger.js';

// ==================== VALIDATION ERROR CLASS ====================

export class ValidationError extends Error {
  constructor(
    message: string,
    public hints: string[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ==================== HELPER FUNCTIONS ====================

export async function getLinearClientForAccount(
  configManager: ConfigManager,
  accountName?: string
): Promise<{ client: LinearClient; account: Account }> {
  if (!accountName) {
    throw new ValidationError('Account is required', [
      'Use --account flag to specify which account to use',
      'Run `linear account list` to see available accounts'
    ]);
  }

  const account = configManager.getAccount(accountName);
  if (!account) {
    throw new ValidationError(`Account '${accountName}' not found`, [
      'Run `linear account list` to see available accounts'
    ]);
  }

  return {
    client: new LinearClient({ apiKey: account.api_key }),
    account
  };
}

export function handleValidationError(error: ValidationError): void {
  Logger.error(error.message);
  error.hints.forEach((hint) => {
    Logger.dim(hint);
  });
}

// ==================== MAIN CLIENT CLASS ====================

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

    const account = this.configManager.getAccount(accountName);
    if (!account) {
      throw new Error(`Account '${accountName}' not found. Please check your accounts using "linear account list"`);
    }

    this.client = new LinearClient({
      apiKey: account.api_key
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
    const client = new LinearClient({ apiKey: account.api_key });

    // Fetch issue with all related data
    const issue = await client.issue(issueId);
    const [state, assignee, labels, comments] = await Promise.all([
      issue.state,
      issue.assignee,
      issue.labels(),
      issue.comments()
    ]);

    // Generate suggested branch name
    const branchName = this.generateBranchName(issue.identifier, issue.title);

    // Fetch pull requests if available
    const pullRequests: IssueData['pullRequests'] = [];
    try {
      const attachments = await issue.attachments();
      for (const attachment of attachments.nodes) {
        if (attachment.url?.includes('github.com') && attachment.url.includes('/pull/')) {
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
    } catch (_error) {
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
    const accounts = this.configManager.getAllAccounts();

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
        const client = new LinearClient({ apiKey: account.api_key });
        await client.issue(issueId);

        // Update workspace cache for this account
        if (workspace && !account.workspaces?.includes(workspace)) {
          const workspaces = account.workspaces || [];
          workspaces.push(workspace);
          await this.configManager.updateAccountWorkspaces(account.name, workspaces);
        }

        return account;
      } catch (_error) {}
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
    const truncatedTitle =
      cleanTitle.length > maxLength ? cleanTitle.substring(0, maxLength).replace(/-$/, '') : cleanTitle;

    return `${identifier.toLowerCase()}/${truncatedTitle}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = this.ensureClient();
      await client.viewer;
      return true;
    } catch (_error) {
      return false;
    }
  }

  // ==================== ISSUE UTILITY METHODS ====================

  parseIssueIdentifier(input: string): string | null {
    if (!input) return null;

    // Handle direct issue ID (e.g., "WORK-123")
    const issueIdPattern = /^[A-Z]+-\d+$/;
    if (issueIdPattern.test(input)) {
      return input;
    }

    // Handle Linear URL
    const urlPattern = /linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/;
    const match = input.match(urlPattern);
    if (match?.[1]) {
      return match[1];
    }

    return null;
  }

  // ==================== FORMATTING METHODS ====================

  formatIssue(issue: IssueData): string {
    const output: string[] = [];

    // Header
    output.push(chalk.bold.blue(`\n🎯 ${issue.identifier}: ${issue.title}`));
    output.push(chalk.dim(`${issue.url}`));
    output.push('');

    // State and assignee
    output.push(`${chalk.bold('Status:')} ${chalk.hex(issue.state.color)(issue.state.name)}`);

    if (issue.assignee) {
      output.push(`${chalk.bold('Assignee:')} ${issue.assignee.name} (${issue.assignee.email})`);
    }

    // Branch name
    output.push(`${chalk.bold('Suggested Branch:')} ${chalk.green(issue.branchName)}`);

    // Labels
    if (issue.labels.length > 0) {
      const labelStrings = issue.labels.map((label: { color: string; name: string }) =>
        chalk.hex(label.color)(label.name)
      );
      output.push(`${chalk.bold('Labels:')} ${labelStrings.join(', ')}`);
    }

    // Pull Requests
    if (issue.pullRequests.length > 0) {
      output.push(`${chalk.bold('Pull Requests:')}`);
      issue.pullRequests.forEach(
        (pr: {
          id: string;
          url: string;
          title: string;
          number: number;
          draft: boolean;
          merged: boolean;
          branch: string;
        }) => {
          const prStatus = pr.merged ? '✅ Merged' : pr.draft ? '📝 Draft' : '🔄 Open';
          output.push(`  ${prStatus} #${pr.number}: ${pr.title}`);
          output.push(`    ${chalk.dim(pr.url)}`);
        }
      );
    }

    output.push('');

    // Description
    if (issue.description) {
      output.push(chalk.bold('Description:'));
      output.push(this.formatMarkdown(issue.description));
      output.push('');
    }

    // Comments
    if (issue.comments.length > 0) {
      output.push(chalk.bold('Comments:'));
      issue.comments.forEach(
        (
          comment: { id: string; body: string; user: { name: string; email: string }; createdAt: Date },
          index: number
        ) => {
          output.push(`\n${chalk.bold(`Comment ${index + 1}:`)} ${comment.user.name} (${comment.user.email})`);
          output.push(chalk.dim(`${comment.createdAt.toLocaleString()}`));
          output.push(this.formatMarkdown(comment.body));
        }
      );
    }

    // Timestamps
    output.push('');
    output.push(chalk.dim(`Created: ${issue.createdAt.toLocaleString()}`));
    output.push(chalk.dim(`Updated: ${issue.updatedAt.toLocaleString()}`));

    return output.join('\n');
  }

  private formatMarkdown(text: string): string {
    // Basic markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'))
      .replace(/\*(.*?)\*/g, chalk.italic('$1'))
      .replace(/`(.*?)`/g, chalk.cyan('$1'))
      .replace(/^#{1,6}\s*(.*$)/gm, chalk.bold.underline('$1'))
      .replace(/^-\s*(.*$)/gm, `  • $1`)
      .replace(/^\d+\.\s*(.*$)/gm, `  $1`);
  }

  // ==================== PROJECT METHODS ====================

  public parseProjectUrl(idOrUrl: string): { workspace: string | null; projectId: string } {
    const urlMatch = idOrUrl.match(/linear\.app\/([^/]+)\/project\/([^/?]+)/);
    if (urlMatch) {
      const slugPart = urlMatch[2];
      const idMatch = slugPart.match(/([a-f0-9]{8,})/);
      const projectId = idMatch ? idMatch[1] : slugPart;

      return {
        workspace: urlMatch[1],
        projectId
      };
    }

    return {
      workspace: null,
      projectId: idOrUrl
    };
  }

  async getProjectByIdOrUrl(idOrUrl: string): Promise<ProjectData> {
    const { workspace, projectId } = this.parseProjectUrl(idOrUrl);
    const account = await this.findAccountForWorkspace(workspace, projectId);

    if (!account) {
      throw new Error(`No account found that can access this project. Please check your accounts and API keys.`);
    }

    const client = new LinearClient({ apiKey: account.api_key });
    const project = await client.project(projectId);
    const [lead, content] = await Promise.all([project.lead, project.content]);

    return {
      id: project.id,
      name: project.name,
      description: content || project.description,
      state: project.state,
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      targetDate: project.targetDate ? new Date(project.targetDate) : undefined,
      lead: lead
        ? {
            name: lead.name,
            email: lead.email
          }
        : undefined,
      progress: project.progress,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      url: project.url
    };
  }

  async getProjectIssues(idOrUrl: string): Promise<ProjectIssueData[]> {
    const { workspace, projectId } = this.parseProjectUrl(idOrUrl);
    const account = await this.findAccountForWorkspace(workspace, projectId);

    if (!account) {
      throw new Error(`No account found that can access this project. Please check your accounts and API keys.`);
    }

    const client = new LinearClient({ apiKey: account.api_key });
    const project = await client.project(projectId);
    const issues = await project.issues();

    return await Promise.all(
      issues.nodes.map(async (issue) => {
        const [state, assignee, project, labels, attachments, children] = await Promise.all([
          issue.state,
          issue.assignee,
          issue.project,
          issue.labels(),
          issue.attachments(),
          issue.children()
        ]);

        const pullRequests: ProjectIssueData['pullRequests'] = [];
        for (const attachment of attachments.nodes) {
          if (attachment.url?.includes('github.com') && attachment.url.includes('/pull/')) {
            const prMatch = attachment.url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
            if (prMatch) {
              pullRequests.push({
                id: attachment.id,
                url: attachment.url,
                title: attachment.title || 'Pull Request',
                number: parseInt(prMatch[2]),
                draft: false,
                merged: false
              });
            }
          }
        }

        const subIssues: ProjectIssueData['subIssues'] = await Promise.all(
          children.nodes.map(async (child) => {
            const childState = await child.state;
            return {
              identifier: child.identifier,
              title: child.title,
              completed: childState?.type === 'completed' || false
            };
          })
        );

        const projectMilestones = project ? await project.projectMilestones() : null;
        const projectMilestone =
          projectMilestones && projectMilestones.nodes.length > 0 ? projectMilestones.nodes[0] : null;

        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
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
          dueDate: issue.dueDate ? new Date(issue.dueDate) : undefined,
          project: project
            ? {
                name: project.name,
                milestone: projectMilestone?.name
              }
            : undefined,
          priority: issue.priority,
          labels: labels.nodes.map((label) => ({
            name: label.name,
            color: label.color
          })),
          pullRequests,
          subIssues,
          url: issue.url
        };
      })
    );
  }

  formatProject(project: ProjectData): string {
    const output: string[] = [];

    output.push(chalk.bold.blue(`\n📊 ${project.name}`));
    output.push(chalk.dim(`${project.url}`));
    output.push('');

    output.push(`${chalk.bold('State:')} ${project.state}`);

    if (project.progress !== undefined) {
      const progressPercent = Math.round(project.progress * 100);
      output.push(`${chalk.bold('Progress:')} ${progressPercent}%`);
    }

    if (project.lead) {
      output.push(`${chalk.bold('Lead:')} ${project.lead.name} (${project.lead.email})`);
    }

    if (project.startDate) {
      output.push(`${chalk.bold('Start Date:')} ${project.startDate.toLocaleDateString()}`);
    }

    if (project.targetDate) {
      output.push(`${chalk.bold('Target Date:')} ${project.targetDate.toLocaleDateString()}`);
    }

    output.push('');

    if (project.description) {
      output.push(chalk.bold('Description:'));
      output.push(this.formatMarkdown(project.description));
      output.push('');
    }

    output.push(chalk.dim(`Created: ${project.createdAt.toLocaleString()}`));
    output.push(chalk.dim(`Updated: ${project.updatedAt.toLocaleString()}`));

    return output.join('\n');
  }

  formatProjectIssues(issues: ProjectIssueData[]): string {
    const output: string[] = [];

    output.push(chalk.bold.blue(`\n📋 Project Issues (${issues.length})`));
    output.push('');

    if (issues.length === 0) {
      output.push(chalk.dim('No issues found in this project.'));
      return output.join('\n');
    }

    const issuesByStatus = new Map<string, ProjectIssueData[]>();

    for (const issue of issues) {
      const statusName = issue.state.name;
      if (!issuesByStatus.has(statusName)) {
        issuesByStatus.set(statusName, []);
      }
      issuesByStatus.get(statusName)?.push(issue);
    }

    const statusOrder = ['Product Review', 'In Progress', 'Todo', 'Done', 'Canceled'];
    const sortedStatuses = Array.from(issuesByStatus.keys()).sort((a, b) => {
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const statusName of sortedStatuses) {
      const statusIssues = issuesByStatus.get(statusName) || [];
      const statusColor = statusIssues[0]?.state.color || '#000000';

      output.push(chalk.hex(statusColor).bold(`${statusName} (${statusIssues.length})`));
      output.push('');

      for (const issue of statusIssues) {
        const identifier = chalk.bold(issue.identifier);
        output.push(`  ${identifier} ${issue.title}`);

        const details: string[] = [];

        if (issue.assignee) {
          details.push(`Assigned: ${issue.assignee.name}`);
        } else {
          details.push(`Assigned: ${chalk.dim('Unassigned')}`);
        }

        if (issue.priority !== undefined) {
          const priorityLabels = ['No priority', 'Urgent', 'High', 'Medium', 'Low'];
          details.push(`Priority: ${priorityLabels[issue.priority] || 'Unknown'}`);
        }

        if (issue.dueDate) {
          details.push(`Due: ${issue.dueDate.toLocaleDateString()}`);
        }

        if (issue.project?.milestone) {
          details.push(`Milestone: ${issue.project.milestone}`);
        }

        output.push(chalk.dim(`    ${details.join(' • ')}`));

        if (issue.labels.length > 0) {
          const labelStrings = issue.labels.map((label) => chalk.hex(label.color)(label.name));
          output.push(chalk.dim(`    Labels: ${labelStrings.join(', ')}`));
        }

        if (issue.pullRequests.length > 0) {
          output.push(chalk.dim(`    PRs: ${issue.pullRequests.length}`));
          issue.pullRequests.forEach((pr) => {
            const prStatus = pr.merged ? '✅' : pr.draft ? '📝' : '🔄';
            output.push(chalk.dim(`      ${prStatus} #${pr.number}: ${pr.title}`));
            output.push(chalk.dim(`         ${pr.url}`));
          });
        }

        if (issue.subIssues.length > 0) {
          const completed = issue.subIssues.filter((sub) => sub.completed).length;
          output.push(chalk.dim(`    Sub-issues: ${completed}/${issue.subIssues.length} completed`));
          issue.subIssues.forEach((sub) => {
            const status = sub.completed ? '✅' : '⬜';
            output.push(chalk.dim(`      ${status} ${sub.identifier}: ${sub.title}`));
          });
        }

        output.push(chalk.dim(`    ${issue.url}`));
        output.push('');
      }

      output.push('');
    }

    return output.join('\n');
  }

  // ==================== DOCUMENT METHODS ====================

  public parseDocumentUrl(idOrUrl: string): { workspace: string | null; documentId: string } {
    const urlMatch = idOrUrl.match(/linear\.app\/([^/]+)\/document\/([^/?]+)/);
    if (urlMatch) {
      const slugPart = urlMatch[2];
      const idMatch = slugPart.match(/([a-f0-9]{8,})/);
      const documentId = idMatch ? idMatch[1] : slugPart;

      return {
        workspace: urlMatch[1],
        documentId
      };
    }

    return {
      workspace: null,
      documentId: idOrUrl
    };
  }

  async getDocumentByIdOrUrl(idOrUrl: string): Promise<DocumentData> {
    const { workspace, documentId } = this.parseDocumentUrl(idOrUrl);
    const account = await this.findAccountForWorkspace(workspace, documentId);

    if (!account) {
      throw new Error(`No account found that can access this document. Please check your accounts and API keys.`);
    }

    const client = new LinearClient({ apiKey: account.api_key });
    const document = await client.document(documentId);
    const creator = await document.creator;
    const updatedBy = await document.updatedBy;

    return {
      id: document.id,
      title: document.title,
      content: document.content,
      createdBy: creator
        ? {
            name: creator.name,
            email: creator.email
          }
        : undefined,
      updatedBy: updatedBy
        ? {
            name: updatedBy.name,
            email: updatedBy.email
          }
        : undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      url: document.url
    };
  }

  formatDocument(document: DocumentData): string {
    const output: string[] = [];

    output.push(chalk.bold.blue(`\n📄 ${document.title}`));
    output.push(chalk.dim(`${document.url}`));
    output.push('');

    if (document.createdBy) {
      output.push(`${chalk.bold('Created by:')} ${document.createdBy.name} (${document.createdBy.email})`);
    }

    if (document.updatedBy) {
      output.push(`${chalk.bold('Last updated by:')} ${document.updatedBy.name} (${document.updatedBy.email})`);
    }

    output.push('');

    if (document.content) {
      output.push(chalk.bold('Content:'));
      output.push(this.formatMarkdown(document.content));
      output.push('');
    }

    output.push(chalk.dim(`Created: ${document.createdAt.toLocaleString()}`));
    output.push(chalk.dim(`Updated: ${document.updatedAt.toLocaleString()}`));

    return output.join('\n');
  }
}
