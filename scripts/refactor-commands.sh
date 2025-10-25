#!/bin/bash

PROJECT_CMD="src/commands/project"
DOCUMENT_CMD="src/commands/document"

refactor_file() {
    local file=$1
    local cmd_name=$2
    local subcmd_name=$3

    if [[ ! -f "$file" ]]; then
        echo "Skipping $file (not found)"
        return
    fi

    if grep -q "createSubCommandFromSchema" "$file"; then
        echo "Skipping $file (already refactored)"
        return
    fi

    echo "Refactoring $file..."

    perl -i -p0e "s/import \{ Command \} from 'commander';/import { Command } from 'commander';\nimport { CommandNames, SubCommandNames } from '..\/..\/schemas\/definitions.js';\nimport { createSubCommandFromSchema } from '..\/..\/schemas\/utils.js';/" "$file"

    perl -i -p0e "s/return new Command\(['\"]$subcmd_name['\"]\)\s*\.description\([^)]+\)\s*\.(?:requiredOption|option|argument)\([^;]+;\s*\.action\(async \([^)]+\) => \{/return createSubCommandFromSchema(CommandNames.$cmd_name, SubCommandNames.${cmd_name}_${subcmd_name^^}, async (/" "$file"

    perl -i -p0e "s/return new Command\(['\"]$subcmd_name['\"]\)\s*\.description\([^)]+\)\s*\.action\(async \([^)]+\) => \{/return createSubCommandFromSchema(CommandNames.$cmd_name, SubCommandNames.${cmd_name}_${subcmd_name^^}, async (/" "$file"
}

refactor_file "$PROJECT_CMD/list-projects.ts" "PROJECT" "list"
refactor_file "$PROJECT_CMD/show-project.ts" "PROJECT" "show"
refactor_file "$PROJECT_CMD/list-project-issues.ts" "PROJECT" "issues"
refactor_file "$PROJECT_CMD/create-project.ts" "PROJECT" "create"
refactor_file "$PROJECT_CMD/delete-project.ts" "PROJECT" "delete"

refactor_file "$DOCUMENT_CMD/show-document.ts" "DOCUMENT" "show"
refactor_file "$DOCUMENT_CMD/add-document.ts" "DOCUMENT" "add"
refactor_file "$DOCUMENT_CMD/delete-document.ts" "DOCUMENT" "delete"

perl -i -p0e "s/const project = new Command\('project'\);\s*project\.description\('Manage Linear projects'\);/const project = createCommandFromSchema(CommandNames.PROJECT);/" src/commands/project/index.ts
perl -i -p0e "s/import \{ Command \} from 'commander';/import { Command } from 'commander';\nimport { CommandNames } from '..\/..\/schemas\/definitions.js';\nimport { createCommandFromSchema } from '..\/..\/schemas\/utils.js';/" src/commands/project/index.ts

perl -i -p0e "s/const document = new Command\('document'\);\s*document\.description\('Manage Linear documents'\);/const document = createCommandFromSchema(CommandNames.DOCUMENT);/" src/commands/document/index.ts
perl -i -p0e "s/import \{ Command \} from 'commander';/import { Command } from 'commander';\nimport { CommandNames } from '..\/..\/schemas\/definitions.js';\nimport { createCommandFromSchema } from '..\/..\/schemas\/utils.js';/" src/commands/document/index.ts

perl -i -p0e "s/return new Command\('update'\)\s*\.description\([^)]+\)\s*\.action\(async \(\) => \{/return createCommandFromSchema(CommandNames.UPDATE, async () => {/" src/commands/update.ts
perl -i -p0e "s/import \{ Command \} from 'commander';/import { Command } from 'commander';\nimport { CommandNames } from '..\/schemas\/definitions.js';\nimport { createCommandFromSchema } from '..\/schemas\/utils.js';/" src/commands/update.ts

echo "Done!"
