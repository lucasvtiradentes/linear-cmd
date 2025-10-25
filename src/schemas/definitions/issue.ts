import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export const issueCommandDefinition: Command = {
  name: CommandNames.ISSUE,
  description: 'Manage Linear issues',
  subcommands: [
    {
      name: SubCommandNames.ISSUE_SHOW,
      description: 'Show issue details',
      arguments: [
        {
          name: 'issue',
          description: 'Issue ID or URL',
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
      examples: [
        `${CLI_NAME} issue show ISSUE-123`,
        `${CLI_NAME} issue show https://linear.app/team/issue/ISSUE-123`,
        `${CLI_NAME} issue show ISSUE-123 --format json`
      ]
    },
    {
      name: SubCommandNames.ISSUE_CREATE,
      description: 'Create a new issue',
      flags: [
        {
          name: '--title',
          alias: '-t',
          description: 'Issue title',
          type: 'string',
          required: true
        },
        {
          name: '--description',
          alias: '-d',
          description: 'Issue description',
          type: 'string'
        },
        {
          name: '--priority',
          alias: '-p',
          description: 'Priority (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)',
          type: 'number'
        },
        {
          name: '--state',
          alias: '-s',
          description: 'State name',
          type: 'string'
        },
        {
          name: '--assignee',
          alias: '-a',
          description: 'Assignee email',
          type: 'string'
        },
        {
          name: '--label',
          alias: '-l',
          description: 'Label name',
          type: 'string'
        },
        {
          name: '--project',
          description: 'Project name or ID',
          type: 'string'
        },
        {
          name: '--account',
          description: 'Account to use',
          type: 'string'
        }
      ],
      examples: [
        `${CLI_NAME} issue create --title "Fix bug"`,
        `${CLI_NAME} issue create --title "New feature" --description "Description" --priority 2`,
        `${CLI_NAME} issue create --title "Task" --assignee user@example.com --label bug`
      ]
    },
    {
      name: SubCommandNames.ISSUE_LIST,
      description: 'List issues',
      flags: [
        {
          name: '--state',
          alias: '-s',
          description: 'Filter by state',
          type: 'string'
        },
        {
          name: '--assignee',
          alias: '-a',
          description: 'Filter by assignee email',
          type: 'string'
        },
        {
          name: '--label',
          alias: '-l',
          description: 'Filter by label',
          type: 'string'
        },
        {
          name: '--project',
          alias: '-p',
          description: 'Filter by project',
          type: 'string'
        },
        {
          name: '--limit',
          description: 'Max number of issues to show',
          type: 'number'
        },
        {
          name: '--format',
          alias: '-f',
          description: 'Output format',
          type: 'string',
          choices: ['pretty', 'json']
        },
        {
          name: '--account',
          description: 'Account to use',
          type: 'string'
        }
      ],
      examples: [
        `${CLI_NAME} issue list`,
        `${CLI_NAME} issue list --state "In Progress"`,
        `${CLI_NAME} issue list --assignee user@example.com --limit 20`,
        `${CLI_NAME} issue list --format json`
      ]
    },
    {
      name: SubCommandNames.ISSUE_UPDATE,
      description: 'Update an issue',
      arguments: [
        {
          name: 'issue',
          description: 'Issue ID or URL',
          type: 'string',
          required: true
        }
      ],
      flags: [
        {
          name: '--title',
          alias: '-t',
          description: 'New title',
          type: 'string'
        },
        {
          name: '--description',
          alias: '-d',
          description: 'New description',
          type: 'string'
        },
        {
          name: '--priority',
          alias: '-p',
          description: 'Priority (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)',
          type: 'number'
        },
        {
          name: '--state',
          alias: '-s',
          description: 'State name',
          type: 'string'
        },
        {
          name: '--assignee',
          alias: '-a',
          description: 'Assignee email',
          type: 'string'
        },
        {
          name: '--label',
          alias: '-l',
          description: 'Label name',
          type: 'string'
        }
      ],
      examples: [
        `${CLI_NAME} issue update ISSUE-123 --state Done`,
        `${CLI_NAME} issue update ISSUE-123 --title "Updated title" --priority 1`,
        `${CLI_NAME} issue update ISSUE-123 --assignee user@example.com`
      ]
    },
    {
      name: SubCommandNames.ISSUE_COMMENT,
      description: 'Add a comment to an issue',
      arguments: [
        {
          name: 'issue',
          description: 'Issue ID or URL',
          type: 'string',
          required: true
        }
      ],
      flags: [
        {
          name: '--body',
          alias: '-b',
          description: 'Comment body',
          type: 'string',
          required: true
        }
      ],
      examples: [
        `${CLI_NAME} issue comment ISSUE-123 --body "Great work!"`,
        `${CLI_NAME} issue comment ISSUE-123 -b "Need more info"`
      ]
    }
  ]
};
