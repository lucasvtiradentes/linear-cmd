import { CLI_NAME } from '../constants.js';
import { type Command, CommandNames, SubCommandNames } from '../definitions.js';

export const projectCommandDefinition: Command = {
  name: CommandNames.PROJECT,
  description: 'Manage Linear projects',
  subcommands: [
    {
      name: SubCommandNames.PROJECT_LIST,
      description: 'List all projects',
      flags: [
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
      examples: [`${CLI_NAME} project list`, `${CLI_NAME} project list --format json`]
    },
    {
      name: SubCommandNames.PROJECT_SHOW,
      description: 'Show project details',
      arguments: [
        {
          name: 'project',
          description: 'Project name or ID',
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
      examples: [`${CLI_NAME} project show "My Project"`, `${CLI_NAME} project show PROJECT-123 --format json`]
    },
    {
      name: SubCommandNames.PROJECT_ISSUES,
      description: 'List issues in a project',
      arguments: [
        {
          name: 'project',
          description: 'Project name or ID',
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
        },
        {
          name: '--limit',
          description: 'Max number of issues to show',
          type: 'number'
        }
      ],
      examples: [`${CLI_NAME} project issues "My Project"`, `${CLI_NAME} project issues PROJECT-123 --limit 50`]
    },
    {
      name: SubCommandNames.PROJECT_CREATE,
      description: 'Create a new project',
      flags: [
        {
          name: '--name',
          alias: '-n',
          description: 'Project name',
          type: 'string',
          required: true
        },
        {
          name: '--description',
          alias: '-d',
          description: 'Project description',
          type: 'string'
        },
        {
          name: '--account',
          description: 'Account to use',
          type: 'string'
        }
      ],
      examples: [
        `${CLI_NAME} project create --name "New Project"`,
        `${CLI_NAME} project create --name "Q2 Goals" --description "Goals for Q2 2024"`
      ]
    },
    {
      name: SubCommandNames.PROJECT_DELETE,
      description: 'Delete a project',
      arguments: [
        {
          name: 'project',
          description: 'Project name or ID',
          type: 'string',
          required: true
        }
      ],
      examples: [`${CLI_NAME} project delete "Old Project"`, `${CLI_NAME} project delete PROJECT-123`]
    }
  ]
};
