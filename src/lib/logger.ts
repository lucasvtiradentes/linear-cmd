import { colors } from './colors.js';

class Logger {
  info(message: string): void {
    console.log(message);
  }

  success(message: string): void {
    console.log(colors.green(message));
  }

  error(message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(colors.red(message), error);
    } else {
      console.error(colors.red(message));
    }
  }

  warning(message: string): void {
    console.log(colors.yellow(message));
  }

  dim(message: string): void {
    console.log(colors.dim(message));
  }

  blue(message: string): void {
    console.log(colors.blue(message));
  }

  cyan(message: string): void {
    console.log(colors.cyan(message));
  }

  bold(message: string): void {
    console.log(colors.bold(message));
  }

  loading(message: string): void {
    console.log(colors.blue(message));
  }

  link(url: string, prefix?: string): void {
    const linkText = prefix ? `${prefix} ${url}` : url;
    console.log(colors.dim(`🔗 ${linkText}`));
  }

  json(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
  }

  newline(): void {
    console.log('');
  }

  divider(length = 80): void {
    console.log(colors.dim('─'.repeat(length)));
  }

  plain(message: string): void {
    console.log(message);
  }
}

export const logger = new Logger();
export { Logger };
