<div align="center">
<a href="https://linear.app" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/linear/linear/master/docs/logo.svg" alt="Linear logo">
</a>
<h2>Linear cmd</h2>
<p>A GitHub CLI-like tool for Linear</p>
</div>



## :star: Features

- **Multi-account support** - Manage multiple Linear accounts with per-command selection
- **Complete issue management** - Create, list, update, comment, and view detailed issue information
- **Smart account discovery** - Automatically finds the right account for issue operations
- **Advanced filtering** - Filter issues by assignee, state, labels, and projects
- **Grouped issue views** - List issues organized by status (Todo, In Progress, Done, etc.)
- **Optimized performance** - Fetches all data in minimal API calls to avoid rate limits
- **Self-updating** - Built-in update mechanism that detects your package manager

## :question: Motivation

Why build this when we already have [Linear MCP](https://linear.app/docs/mcp)?

Because I want to be able to just paste a Linear issue link into my [Claude code](https://www.anthropic.com/claude-code) and have it solve the problem. Currently, the Linear MCP server does **not** support using multiple Linear accounts (I use one for work and one for my personal projects).

## :rocket: Quick Start

1. **Get your Linear API Key** from [Linear Settings](https://linear.app/settings) > Security & Access > Personal API keys
2. **Add your account**: `linear account add` (Then you need to set a name and paste your API_KEY)
3. **View an issue**: `linear issue show WORK-123`

## :bulb: Usage

### Installation

```bash
npm install linear-cmd -g
# to uninstall run: npm uninstall linear-cmd -g
```

### General

```bash
linear --help                              # Show detailed help and examples
linear update                              # Update to latest version (auto-detects npm/yarn/pnpm)
linear <command> --help                    # Show help for specific command
```

### Account Management

```bash
linear account add                         # Add account
linear account list                        # List accounts
linear account remove [NAME]               # Remove account 
linear account test                        # Test connection of all your accounts
```

### Issue Management

```bash
# Viewing issues
linear issue show <linear-url>             # Show by URL
linear issue show WORK-123                 # Show by ID
linear issue show WORK-123 --account work  # Show by ID (specifying account)

# Listing issues (grouped by status)
linear issue list -a work                  # List all issues
linear issue list -a work --assignee me    # List my issues
linear issue list -a work --state "In Progress"  # Filter by state
linear issue list -a work --project "API"  # Filter by project
linear issue list -a work --label "bug"    # Filter by label

# Issues are automatically grouped by status:
# ✅ Done (415)
# 🔄 In Progress (5)
# 📋 Todo (1)
# ❌ Canceled (12)
```

<details>
<summary>Creating Issues</summary>
</br>


```bash
# Interactive mode (prompts for missing fields)
linear issue create --account work

# Direct mode with flags
linear issue create --account work \
  --title "Issue title" \
  --description "Issue description" \
  --priority 2 \
  --label "bug" \
  --team "TEAM" \
  --project "Project Name" \
  --assignee "user@example.com"
```

</details>

<details>
<summary>Updating Issues</summary>
</br>

```bash
# Interactive mode (choose what to update)
linear issue update WORK-123

# Direct mode with flags
linear issue update WORK-123 \
  --title "New title" \
  --description "New description" \
  --state "In Progress" \
  --assignee "user@example.com" \
  --priority 1 \
  --add-label "urgent" \
  --remove-label "low-priority"
```

</details>

<details>
<summary>Commenting on Issues</summary>
</br>

```bash
# Interactive mode (prompts for comment)
linear issue comment WORK-123

# Direct mode with comment text
linear issue comment WORK-123 "This is my comment"
```

</details>

### Project Management

```bash
linear project show <project-url>          # Show project details
linear project issues <project-url>        # List all issues in a project
```

### Document Management

```bash
linear document show <document-url>        # Show document content
```

## :gear: Shell Completion

Enable autocompletion for commands and subcommands in your shell:

```bash
# Install completion for your current shell (auto-detects and gives instructions)
linear completion install
```

After installation, restart your shell or source your shell config file:

```bash
# For zsh
source ~/.zshrc

# For bash  
source ~/.bashrc
```

Now you can use tab completion:
- `linear <TAB>` → shows: account, issue, project, document, update, completion
- `linear account <TAB>` → shows: add, list, remove, test
- `linear issue <TAB>` → shows: show, create, list, update, comment
- `linear project <TAB>` → shows: show, issues
- `linear document <TAB>` → shows: show

## :wrench: Development

```bash
pnpm run dev                               # Run in development
pnpm run build                             # Build for production
pnpm run test                              # Run tests
```

## :scroll: License

MIT License - see [LICENSE](LICENSE) file for details.
