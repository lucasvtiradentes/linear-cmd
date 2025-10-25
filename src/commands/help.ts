import { Logger } from '../lib/logger.js';
import { generateHelp } from '../schemas/generators/help-generator.js';

export function displayHelp(): void {
  const helpText = generateHelp();
  Logger.plain(helpText);
  Logger.plain('');
  Logger.bold('Getting Started:');
  Logger.plain('  1. Get your API key from Linear Settings > Account > API');
  Logger.plain('  2. Run: linear account add');
  Logger.plain('  3. Test connection: linear account test');
  Logger.plain('  4. List your issues: linear issue list -a <account-name> --assignee me');
  Logger.plain('');
  Logger.dim('For more information, visit: https://linear.app/developers');
}
