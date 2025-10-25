import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export interface DocumentShowOptions {
  format?: string;
}

export interface DocumentAddOptions {
  account: string;
  title?: string;
  content?: string;
  project?: string;
}

export interface DocumentDeleteOptions {
  yes?: boolean;
}

export const documentCommandDefinition: Command = {
  name: CommandNames.DOCUMENT,
  description: 'Manage Linear documents',
  subcommands: [
    {
      name: SubCommandNames.DOCUMENT_SHOW,
      description: 'Show document details',
      arguments: [
        {
          name: 'document',
          description: 'Document ID or URL',
          type: 'string',
          required: true
        }
      ],
      flags: [
        {
          name: '--format',
          alias: '-f',
          description: 'Output format',
          type: 'string',
          choices: ['pretty', 'json']
        }
      ],
      examples: [`${CLI_NAME} document show DOC-123`, `${CLI_NAME} document show https://linear.app/team/doc/DOC-123`]
    },
    {
      name: SubCommandNames.DOCUMENT_ADD,
      description: 'Create a new document',
      flags: [
        {
          name: '--title',
          alias: '-t',
          description: 'Document title',
          type: 'string',
          required: true
        },
        {
          name: '--content',
          alias: '-c',
          description: 'Document content',
          type: 'string'
        },
        {
          name: '--account',
          alias: '-a',
          description: 'Account to use (optional, uses active account if not specified)',
          type: 'string'
        },
        {
          name: '--project',
          description: 'Project name or ID to link the document to',
          type: 'string'
        }
      ],
      examples: [
        `${CLI_NAME} document add --title "Meeting Notes"`,
        `${CLI_NAME} document add --title "RFC" --content "# Proposal\\n\\nDetails..."`
      ]
    },
    {
      name: SubCommandNames.DOCUMENT_DELETE,
      description: 'Delete a document',
      arguments: [
        {
          name: 'document',
          description: 'Document ID or URL',
          type: 'string',
          required: true
        }
      ],
      examples: [`${CLI_NAME} document delete DOC-123`]
    }
  ]
};
