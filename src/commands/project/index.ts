import { Command } from 'commander';
import { CommandNames } from '../../schemas/definitions.js';
import { createCommandFromSchema } from '../../schemas/utils.js';

import { createCreateProjectCommand } from './create.js';
import { createDeleteProjectCommand } from './delete.js';
import { createListProjectIssuesCommand } from './issues.js';
import { createListProjectsCommand } from './list.js';
import { createShowProjectCommand } from './show.js';

export function createProjectCommand(): Command {
  const project = createCommandFromSchema(CommandNames.PROJECT);

  project.addCommand(createListProjectsCommand());
  project.addCommand(createShowProjectCommand());
  project.addCommand(createListProjectIssuesCommand());
  project.addCommand(createCreateProjectCommand());
  project.addCommand(createDeleteProjectCommand());

  return project;
}
