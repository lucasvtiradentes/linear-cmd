<div align="center">
<a href="https://linear.app" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/linear/linear/master/docs/logo.svg" alt="Linear logo">
</a>
<h2>Linear cmd</h2>
<p>A GitHub CLI-like tool for Linear</p>
<p>
  <a href="https://www.npmjs.com/package/linear-cmd"><img src="https://img.shields.io/npm/v/linear-cmd.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <br>
  <a href="#star-features">Features</a> • <a href="#question-motivation">Motivation</a> • <a href="#rocket-quick-start">Quick Start</a> • <a href="#bulb-usage">Usage</a> • <a href="#wrench-development">Development</a>
</p>

</div>

## :star: Features

- **Multi-account support** - Manage multiple Linear accounts
- **Complete issue management** - Create, list, update, comment
- **Project & document support** - Full project and document operations
- **Smart account discovery** - Automatically finds the right account
- **Advanced filtering** - Filter by assignee, state, labels, teams
- **Self-updating** - Built-in update mechanism

## :question: Motivation

Why build this when we already have [Linear MCP](https://linear.app/docs/mcp)?

Because I want to paste a Linear issue link into [Claude Code](https://www.anthropic.com/claude-code) and have it work with multiple Linear accounts (work + personal).

## :rocket: Quick Start

```bash
# Install
npm install linear-cmd -g

# Setup account
linear account add

# Start using
linear issue show WORK-123
```

## :bulb: Usage

### Commands Overview

```bash
linear --help                    # Show help
linear update                    # Update to latest version
```

<details>
<summary><b>Account Management</b></summary>

<!-- BEGIN:ACCOUNT -->
```bash
# Add a new Linear account
linear account add

# List all configured accounts
linear account list

# Remove a Linear account
linear account remove

# Test account connections
linear account test

```

<!-- END:ACCOUNT -->

</details>

<details>
<summary><b>Issue Operations</b></summary>

<!-- BEGIN:ISSUE -->
```bash
# Show issue details
linear issue show ISSUE-123
linear issue show https://linear.app/team/issue/ISSUE-123
linear issue show ISSUE-123 --format json

# Create a new issue
linear issue create --title "Fix bug"
linear issue create --title "New feature" --description "Description" --priority 2
linear issue create --title "Task" --assignee user@example.com --label bug

# List issues
linear issue list
linear issue list --state "In Progress"
linear issue list --assignee user@example.com --limit 20
linear issue list --format json

# Update an issue
linear issue update ISSUE-123 --state Done
linear issue update ISSUE-123 --title "Updated title" --priority 1
linear issue update ISSUE-123 --assignee user@example.com

# Add a comment to an issue
linear issue comment ISSUE-123 --body "Great work!"
linear issue comment ISSUE-123 -b "Need more info"

```

<!-- END:ISSUE -->

</details>

<details>
<summary><b>Project Operations</b></summary>

<!-- BEGIN:PROJECT -->
```bash
# List all projects
linear project list
linear project list --format json

# Show project details
linear project show "My Project"
linear project show PROJECT-123 --format json

# List issues in a project
linear project issues "My Project"
linear project issues PROJECT-123 --limit 50

# Create a new project
linear project create --name "New Project"
linear project create --name "Q2 Goals" --description "Goals for Q2 2024"

# Delete a project
linear project delete "Old Project"
linear project delete PROJECT-123

```

<!-- END:PROJECT -->

</details>

<details>
<summary><b>Document Operations</b></summary>

<!-- BEGIN:DOCUMENT -->
```bash
# Show document details
linear document show DOC-123
linear document show https://linear.app/team/doc/DOC-123

# Create a new document
linear document add --title "Meeting Notes"
linear document add --title "RFC" --content "# Proposal\n\nDetails..."

# Delete a document
linear document delete DOC-123

```

<!-- END:DOCUMENT -->

</details>

<details>
<summary><b>Shell Completion</b></summary>

<!-- BEGIN:COMPLETION -->
```bash
linear completion install
```

<!-- END:COMPLETION -->

</details>

## :wrench: Development

```bash
pnpm install                     # Install dependencies
pnpm run dev                     # Run in development
pnpm run build                   # Build for production
pnpm run test:e2e                # Run E2E tests
```

## :scroll: License

MIT License - see [LICENSE](LICENSE) file for details.
