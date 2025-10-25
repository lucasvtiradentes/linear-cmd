#!/usr/bin/env tsx

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generateBashCompletion, generateZshCompletion } from '../src/schemas/generators/completion-generator.js';
import { generateHelp } from '../src/schemas/generators/help-generator.js';
import { generateReadmeSections } from '../src/schemas/generators/readme-generator.js';
import { COMMANDS_SCHEMA } from '../src/schemas/schema.js';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const COMPLETIONS_DIR = resolve(ROOT_DIR, 'completions');
const DOCS_DIR = resolve(ROOT_DIR, 'docs');
const README_FILE = resolve(ROOT_DIR, 'README.md');

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function validateSchema(): boolean {
  console.log('🔍 Validating commands schema...\n');

  let hasErrors = false;

  for (const cmd of COMMANDS_SCHEMA) {
    if (!cmd.name) {
      console.error('❌ Command missing name');
      hasErrors = true;
    }
    if (!cmd.description) {
      console.error(`❌ Command "${cmd.name}" missing description`);
      hasErrors = true;
    }

    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        if (!sub.name) {
          console.error(`❌ Subcommand in "${cmd.name}" missing name`);
          hasErrors = true;
        }
        if (!sub.description) {
          console.error(`❌ Subcommand "${cmd.name} ${sub.name}" missing description`);
          hasErrors = true;
        }

        if (sub.flags) {
          for (const flag of sub.flags) {
            if (!flag.name) {
              console.error(`❌ Flag in "${cmd.name} ${sub.name}" missing name`);
              hasErrors = true;
            }
            if (!flag.type) {
              console.error(`❌ Flag "${flag.name}" in "${cmd.name} ${sub.name}" missing type`);
              hasErrors = true;
            }
          }
        }
      }
    }

    if (cmd.flags) {
      for (const flag of cmd.flags) {
        if (!flag.name) {
          console.error(`❌ Flag in "${cmd.name}" missing name`);
          hasErrors = true;
        }
        if (!flag.type) {
          console.error(`❌ Flag "${flag.name}" in "${cmd.name}" missing type`);
          hasErrors = true;
        }
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Schema validation failed\n');
    return false;
  }

  console.log('✅ Schema validation passed\n');
  return true;
}

function generateCompletionScripts(): void {
  console.log('📝 Generating shell completion scripts...\n');

  const zshFile = resolve(COMPLETIONS_DIR, '_linear');
  const bashFile = resolve(COMPLETIONS_DIR, 'linear.bash');

  ensureDir(zshFile);
  ensureDir(bashFile);

  const zshScript = generateZshCompletion();
  writeFileSync(zshFile, zshScript, 'utf-8');
  console.log('  ✅ Zsh completion: completions/_linear');

  const bashScript = generateBashCompletion();
  writeFileSync(bashFile, bashScript, 'utf-8');
  console.log('  ✅ Bash completion: completions/linear.bash');

  console.log();
}

function generateHelpText(): void {
  console.log('📝 Generating help text...\n');

  const helpFile = resolve(DOCS_DIR, 'help.txt');
  ensureDir(helpFile);

  const helpText = generateHelp();
  const plainHelpText = helpText.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );

  writeFileSync(helpFile, plainHelpText, 'utf-8');
  console.log('  ✅ Help text: docs/help.txt');
  console.log();
}

function updateReadme(): void {
  console.log('📝 Updating README.md with generated content...\n');

  if (!existsSync(README_FILE)) {
    console.error('  ❌ README.md not found');
    return;
  }

  const readme = readFileSync(README_FILE, 'utf-8');
  const sections = generateReadmeSections();

  let updatedReadme = readme;

  const markers: Record<string, string> = {
    '<!-- BEGIN:ACCOUNT -->': sections.account,
    '<!-- BEGIN:ISSUE -->': sections.issue,
    '<!-- BEGIN:PROJECT -->': sections.project,
    '<!-- BEGIN:DOCUMENT -->': sections.document,
    '<!-- BEGIN:COMPLETION -->': sections.completion
  };

  let sectionsUpdated = 0;

  for (const [beginMarker, content] of Object.entries(markers)) {
    const endMarker = beginMarker.replace('BEGIN:', 'END:');
    const regex = new RegExp(`${escapeRegex(beginMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`, 'g');

    if (regex.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(regex, `${beginMarker}\n${content}\n${endMarker}`);
      console.log(`  ✅ Updated: ${beginMarker.replace('<!-- BEGIN:', '').replace(' -->', '')}`);
      sectionsUpdated++;
    } else {
      console.log(`  ⚠️  Marker not found: ${beginMarker.replace('<!-- BEGIN:', '').replace(' -->', '')}`);
    }
  }

  writeFileSync(README_FILE, updatedReadme, 'utf-8');
  console.log(`\n  📄 ${sectionsUpdated}/${Object.keys(markers).length} sections updated in README.md`);
  console.log();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function printSummary(): void {
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log();
  console.log('Generated files:');
  console.log('  • completions/_linear         (Zsh completion)');
  console.log('  • completions/linear.bash     (Bash completion)');
  console.log('  • docs/help.txt               (Help reference)');
  console.log('  • README.md                   (Updated sections)');
  console.log();
  console.log('✨ All command documentation updated successfully!');
  console.log();
  console.log('Next steps:');
  console.log('  1. Review the changes in README.md');
  console.log('  2. Test completions: source completions/linear.bash');
  console.log('  3. Commit the generated files if everything looks good');
  console.log();
}

function main(): void {
  console.log();
  console.log('═'.repeat(60));
  console.log('🔄 UPDATE COMMANDS DOCUMENTATION');
  console.log('═'.repeat(60));
  console.log();

  if (!validateSchema()) {
    process.exit(1);
  }

  try {
    generateCompletionScripts();
  } catch (error) {
    console.error('❌ Failed to generate completion scripts:', error);
    process.exit(1);
  }

  try {
    generateHelpText();
  } catch (error) {
    console.error('❌ Failed to generate help text:', error);
    process.exit(1);
  }

  try {
    updateReadme();
  } catch (error) {
    console.error('❌ Failed to update README:', error);
    process.exit(1);
  }

  printSummary();
}

main();
