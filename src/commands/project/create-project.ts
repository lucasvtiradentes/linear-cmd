import { Command } from 'commander';
import inquirer from 'inquirer';
import { ConfigManager } from '../../lib/config-manager.js';
import { getLinearClientForAccount, handleValidationError, ValidationError } from '../../lib/linear-client.js';
import { logger } from '../../lib/logger.js';

export function createCreateProjectCommand(): Command {
  return new Command('create')
    .description('Create a new Linear project')
    .requiredOption('-a, --account <account>', 'specify account to use')
    .option('-n, --name <name>', 'project name')
    .option('-d, --description <description>', 'project description')
    .option('--team <team>', 'team key (e.g., "TES")')
    .option('--state <state>', 'project state (planned, started, paused, completed, canceled)')
    .option('--target-date <date>', 'target date (YYYY-MM-DD)')
    .action(async (options) => {
      const configManager = new ConfigManager();

      try {
        const { client, account } = await getLinearClientForAccount(configManager, options.account);

        // Get team ID if specified or select interactively
        let teamId: string;
        if (options.team) {
          // Convert team key (like "TES") to team ID
          const teams = await client.teams({ filter: { key: { eq: options.team.toUpperCase() } } });
          if (teams.nodes.length > 0) {
            teamId = teams.nodes[0].id;
          } else {
            logger.error(`Team '${options.team}' not found`);
            logger.dim('\nAvailable teams:');
            const allTeams = await client.teams();
            allTeams.nodes.forEach((t) => logger.dim(`  - ${t.key}: ${t.name}`));
            process.exit(1);
          }
        } else {
          // Interactive team selection
          const teams = await client.teams();
          if (teams.nodes.length === 0) {
            logger.error('No teams found');
            process.exit(1);
          }

          if (teams.nodes.length === 1) {
            teamId = teams.nodes[0].id;
          } else {
            const teamAnswer = await inquirer.prompt([
              {
                type: 'list',
                name: 'team',
                message: 'Select team:',
                choices: teams.nodes.map((t) => ({ name: `${t.name} (${t.key})`, value: t.id }))
              }
            ]);
            teamId = teamAnswer.team;
          }
        }

        // Get project details interactively if not provided
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            when: !options.name,
            validate: (input) => input.length > 0 || 'Name is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Project description (optional):',
            when: !options.description
          }
        ]);

        const name = options.name || answers.name;
        const description = options.description || answers.description || undefined;

        // Create the project
        logger.loading(`Creating project in account: ${account.name}...`);

        const projectPayload: any = {
          name,
          description,
          teamIds: [teamId]
        };

        // Add state if specified
        if (options.state) {
          projectPayload.state = options.state;
        }

        // Add target date if specified
        if (options.targetDate) {
          const targetDate = new Date(options.targetDate);
          if (Number.isNaN(targetDate.getTime())) {
            logger.error('Invalid target date format. Use YYYY-MM-DD');
            process.exit(1);
          }
          projectPayload.targetDate = targetDate;
        }

        const project = await client.createProject(projectPayload);
        const createdProject = await project.project;

        if (!createdProject) {
          throw new Error('Failed to create project');
        }

        logger.success('Project created successfully!');
        logger.info(`📁 Name: ${createdProject.name}`);
        logger.link(createdProject.url, 'URL:');

        if (createdProject.description) {
          logger.dim(`📝 Description: ${createdProject.description}`);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          handleValidationError(error);
        } else {
          logger.error('Error creating project', error);
        }
      }
    });
}
