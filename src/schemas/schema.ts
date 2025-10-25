import { accountCommandDefinition } from './definitions/account.js';
import { completionCommandDefinition } from './definitions/completion.js';
import { documentCommandDefinition } from './definitions/document.js';
import { issueCommandDefinition } from './definitions/issue.js';
import { projectCommandDefinition } from './definitions/project.js';
import { updateCommandDefinition } from './definitions/update.js';
import type { Command } from './definitions.js';

export const COMMANDS_SCHEMA: Command[] = [
  accountCommandDefinition,
  issueCommandDefinition,
  projectCommandDefinition,
  documentCommandDefinition,
  updateCommandDefinition,
  completionCommandDefinition
];
