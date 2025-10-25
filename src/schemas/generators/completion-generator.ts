import { CLI_NAME } from '../constants.js';
import { COMMANDS_SCHEMA } from '../schema.js';

export function generateZshCompletion(): string {
  const commands = COMMANDS_SCHEMA.map((cmd) => `        '${cmd.name}:${cmd.description}'`).join('\n');

  let completionFunctions = '';

  for (const cmd of COMMANDS_SCHEMA) {
    if (cmd.subcommands && cmd.subcommands.length > 0) {
      const commandsName = `_linear_cmd_${cmd.name}_commands`;

      let subcommandFunctions = '';
      let subcommandCases = '';

      for (const sub of cmd.subcommands) {
        if (sub.flags && sub.flags.length > 0) {
          const funcName = `_linear_cmd_${cmd.name}_${sub.name}`;
          const aliases = sub.aliases ? `|${sub.aliases.join('|')}` : '';
          const flagArgs = sub.flags
            .map((flag) => {
              const escapedDesc = flag.description.replace(/'/g, "'\\''");
              if (flag.type === 'boolean') {
                return `        '${flag.name}[${escapedDesc}]'`;
              } else {
                return `        '${flag.name}=[${escapedDesc}]:${flag.type}:'`;
              }
            })
            .join(' \\\n');

          subcommandFunctions += `
${funcName}() {
    _arguments \\
${flagArgs}
}
`;
          subcommandCases += `            ${sub.name}${aliases})
                ${funcName}
                ;;
`;
        }
      }

      completionFunctions += `
_linear_cmd_${cmd.name}() {
    local curcontext="$curcontext" state line
    typeset -A opt_args

    _arguments -C \\
        '1: :${commandsName}' \\
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
${subcommandCases}            esac
            ;;
    esac
}

${commandsName}() {
    local ${cmd.name}_commands
    ${cmd.name}_commands=(
${cmd.subcommands.map((sub) => `        '${sub.name}:${sub.description}'`).join('\n')}
    )
    _describe '${cmd.name} command' ${cmd.name}_commands
}
${subcommandFunctions}`;
    }
  }

  const caseStatements = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const aliases = cmd.aliases ? `|${cmd.aliases.join('|')}` : '';
      return `                ${cmd.name}${aliases})
                    _linear_cmd_${cmd.name}
                    ;;`;
    })
    .join('\n');

  return `#compdef ${CLI_NAME} lin

_linear_cmd() {
    local state line context
    typeset -A opt_args

    _arguments -C \\
        '1: :_linear_cmd_commands' \\
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
${caseStatements}
            esac
            ;;
    esac
}

_linear_cmd_commands() {
    local commands
    commands=(
${commands}
    )
    _describe 'command' commands
}
${completionFunctions}
_linear_cmd "$@"
`;
}

export function generateBashCompletion(): string {
  const mainCommands = COMMANDS_SCHEMA.map((cmd) => cmd.name).join(' ');

  const subcommandVars = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const subcommands = cmd.subcommands?.map((sub) => sub.name).join(' ');
      return `    local ${cmd.name}_commands="${subcommands}"`;
    })
    .join('\n');

  const flagVars = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .flatMap(
      (cmd) =>
        cmd.subcommands
          ?.filter((sub) => sub.flags && sub.flags.length > 0)
          .map((sub) => {
            const flags = sub.flags?.map((flag) => flag.name).join(' ') || '';
            return `    local ${cmd.name}_${sub.name}_flags="${flags}"`;
          }) || []
    )
    .join('\n');

  const caseStatements = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .map((cmd) => {
      const aliases = cmd.aliases ? `|${cmd.aliases.join('|')}` : '';
      return `            ${cmd.name}${aliases})
                COMPREPLY=($(compgen -W "$${cmd.name}_commands" -- "$cur"))
                ;;`;
    })
    .join('\n');

  const flagCases = COMMANDS_SCHEMA.filter((cmd) => cmd.subcommands && cmd.subcommands.length > 0)
    .flatMap(
      (cmd) =>
        cmd.subcommands
          ?.filter((sub) => sub.flags && sub.flags.length > 0)
          .map((sub) => {
            const aliases = sub.aliases ? `|${sub.aliases.join('|')}` : '';
            return `            ${cmd.name}:${sub.name}${aliases})
                COMPREPLY=($(compgen -W "$${cmd.name}_${sub.name}_flags" -- "$cur"))
                ;;`;
          }) || []
    )
    .join('\n');

  return `#!/bin/bash

_linear_cmd_completion() {
    local cur prev words cword
    _init_completion || return

    local commands="${mainCommands}"

${subcommandVars}

${flagVars}

    if [[ $cword -eq 1 ]]; then
        COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    elif [[ $cword -eq 2 ]]; then
        case "\${COMP_WORDS[1]}" in
${caseStatements}
        esac
    elif [[ $cword -gt 2 ]]; then
        local cmd_sub="\${COMP_WORDS[1]}:\${COMP_WORDS[2]}"
        case "$cmd_sub" in
${flagCases}
        esac
    fi
}

complete -F _linear_cmd_completion ${CLI_NAME}
complete -F _linear_cmd_completion linear-cmd
complete -F _linear_cmd_completion lin
`;
}
