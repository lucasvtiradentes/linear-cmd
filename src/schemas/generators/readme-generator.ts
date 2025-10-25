import { COMMANDS_SCHEMA } from '../schema.js';

function generateCommandSection(commandName: string): string {
  const command = COMMANDS_SCHEMA.find((cmd) => cmd.name === commandName);
  if (!command || !command.subcommands) return '';

  let output = '```bash\n';

  for (const sub of command.subcommands) {
    if (sub.examples && sub.examples.length > 0) {
      output += `# ${sub.description}\n`;
      output += `${sub.examples.join('\n')}\n\n`;
    }
  }

  output += '```\n';
  return output;
}

function generateSubCommandSection(commandName: string, subCommandName: string): string {
  const command = COMMANDS_SCHEMA.find((cmd) => cmd.name === commandName);
  const subCommand = command?.subcommands?.find((sub) => sub.name === subCommandName);

  if (!subCommand || !subCommand.examples) return '';

  let output = '```bash\n';

  for (const example of subCommand.examples) {
    output += `${example}\n`;
  }

  output += '```\n';
  return output;
}

export function generateReadmeSections() {
  return {
    account: generateCommandSection('account'),
    issue: generateCommandSection('issue'),
    project: generateCommandSection('project'),
    document: generateCommandSection('document'),
    issueShow: generateSubCommandSection('issue', 'show'),
    issueCreate: generateSubCommandSection('issue', 'create'),
    issueList: generateSubCommandSection('issue', 'list'),
    issueUpdate: generateSubCommandSection('issue', 'update'),
    issueComment: generateSubCommandSection('issue', 'comment'),
    projectList: generateSubCommandSection('project', 'list'),
    projectShow: generateSubCommandSection('project', 'show'),
    completion: generateSubCommandSection('completion', 'install')
  };
}
