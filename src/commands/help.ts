import { logger } from '../lib/logger.js';
import { generateHelp } from '../schemas/generators/help-generator.js';

export function displayHelp(): void {
  logger.info(generateHelp());
}
