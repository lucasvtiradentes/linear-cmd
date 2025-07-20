import chalk from 'chalk';

export function logError(message: string, error?: unknown): void {
  const errorText = error instanceof Error ? error.message : 'Unknown error';
  console.error(chalk.red(`❌ ${message}: ${errorText}`));
}

export function logSuccess(message: string): void {
  console.log(chalk.green(`✅ ${message}`));
}

export function logWarning(message: string): void {
  console.log(chalk.yellow(`⚠️  ${message}`));
}

export function logInfo(message: string): void {
  console.log(chalk.blue(`ℹ️  ${message}`));
}
