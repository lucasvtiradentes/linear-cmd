import chalk from 'chalk';

export const colors = {
  red: (text: string) => chalk.red(text),
  green: (text: string) => chalk.green(text),
  blue: (text: string) => chalk.blue(text),
  yellow: (text: string) => chalk.yellow(text),
  cyan: (text: string) => chalk.cyan(text),
  gray: (text: string) => chalk.gray(text),
  white: (text: string) => chalk.white(text),
  dim: (text: string) => chalk.dim(text),
  bold: (text: string) => chalk.bold(text),
  italic: (text: string) => chalk.italic(text),
  underline: (text: string) => chalk.underline(text),
  boldBlue: (text: string) => chalk.bold.blue(text),
  boldCyan: (text: string) => chalk.bold.cyan(text),
  boldUnderline: (text: string) => chalk.bold.underline(text),
  hex: (color: string) => (text: string) => chalk.hex(color)(text),
  hexBold: (color: string) => (text: string) => chalk.hex(color).bold(text)
};
