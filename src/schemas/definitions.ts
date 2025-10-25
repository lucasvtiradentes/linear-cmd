export interface CommandArgument {
  name: string;
  description: string;
  type: 'string' | 'number';
  required?: boolean;
}

export interface CommandFlag {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  required?: boolean;
  choices?: string[];
}

export interface SubCommand {
  name: string;
  aliases?: string[];
  description: string;
  arguments?: CommandArgument[];
  flags?: CommandFlag[];
  examples?: string[];
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  subcommands?: SubCommand[];
  flags?: CommandFlag[];
  examples?: string[];
}

export const CommandNames = {
  ACCOUNT: 'account',
  ISSUE: 'issue',
  PROJECT: 'project',
  DOCUMENT: 'document',
  UPDATE: 'update',
  COMPLETION: 'completion'
} as const;

export const SubCommandNames = {
  ACCOUNT_ADD: 'add',
  ACCOUNT_LIST: 'list',
  ACCOUNT_REMOVE: 'remove',
  ACCOUNT_TEST: 'test',

  ISSUE_SHOW: 'show',
  ISSUE_CREATE: 'create',
  ISSUE_LIST: 'list',
  ISSUE_UPDATE: 'update',
  ISSUE_COMMENT: 'comment',

  PROJECT_LIST: 'list',
  PROJECT_SHOW: 'show',
  PROJECT_ISSUES: 'issues',
  PROJECT_CREATE: 'create',
  PROJECT_DELETE: 'delete',

  DOCUMENT_SHOW: 'show',
  DOCUMENT_ADD: 'add',
  DOCUMENT_DELETE: 'delete',

  COMPLETION_INSTALL: 'install'
} as const;
