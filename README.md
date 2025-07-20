<div align="center">
<a href="https://linear.app" target="_blank" rel="noopener noreferrer">
  <img width="64" src="https://raw.githubusercontent.com/linear/linear/master/docs/logo.svg" alt="Linear logo">
</a>
<h2>Linear cmd</h2>
</div>

A GitHub CLI-like tool for Linear - manage issues, accounts, and more from your terminal.

## Features

- 🔐 **Multi-account support** - Switch between personal and work accounts
- 📋 **Issue management** - View detailed issue information and PR links
- 🌿 **Branch suggestions** - Get suggested branch names based on issue ID
- 🔒 **Secure storage** - Configuration stored with schema validation
- 🎨 **Beautiful output** - Colorized and formatted output with markdown support

## Motivation

Why build this when we already have [Linear MCP](https://linear.app/docs/mcp)?

Because I want to be able to just paste a Linear issue link into my [Claude code](https://www.anthropic.com/claude-code) and have it solve the problem. Currently, the Linear MCP server does not support using multiple Linear accounts (I use one for work and one for my personal projects).

## Quick Start

1. **Get your Linear API Key** from [Linear Settings](https://linear.app/settings) > Security & Access > Personal API keys
2. **Add your account**: `linear account add`
  - Then you need to set a name and paste your API_KEY
3. **View an issue**: `linear issue show WORK-123`

## Usage

### Installation

```bash
npm install linear-cmd -g
```

### General

```bash
linear update                              # Update to latest version
linear --help                              # Show available commands
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
linear issue show <linear-url>             # Show by URL
linear issue show WORK-123                 # Show by ID
linear issue show WORK-123 --account work  # Show by ID (specifying account)
linear issue list --account work           # List issues (requires account)
linear issue create --account work         # Create new issue (requires account)
linear issue update WORK-123               # Update issue
linear issue comment WORK-123              # Add comment to issue
```

## Development

```bash
pnpm run dev                               # Run in development
pnpm run build                             # Build for production
pnpm run test                              # Run tests
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
