import { Command } from 'commander';

import { createListProjectIssuesCommand } from './list-project-issues.js';
import { createShowProjectCommand } from './show-project.js';

export function createProjectCommand(): Command {
  const project = new Command('project');
  project.description('Manage Linear projects');

  project.addCommand(createShowProjectCommand());
  project.addCommand(createListProjectIssuesCommand());

  return project;
}
