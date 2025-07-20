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

Why do this in a time we have [linear MCP](https://linear.app/docs/mcp)?

Because I want to just paste a linear issue link to my claude code and made it solve the problem, and currently the linear MCP server does not have support us to use multiple linear accounts (I use on for work and one for my personal projects).

## Quick Start

1. **Get your Linear API Key** from [Linear Settings](https://linear.app/settings) > Security & Access > Personal API keys
2. **Add your workspace**: `linear account add`
 - Then you need to sed a name and paste your API_KEY
3. **View an issue**: `linear issue show WAY-123`

## Usage

### Installation

```bash
npm install linear-cmd -g 
```

### Account Management

```bash
linear account add              # Add workspace
linear account list             # List workspaces
linear account test             # Test connection of all your accounts
```

### Issue Management

```bash
linear issue show WAY-123       # Show by ID
linear issue show <linear-url>  # Show by URL
linear issue branch WAY-123     # Get branch name
```

## Development

```bash
pnpm run dev                    # Run in development
pnpm run build                  # Build for production
pnpm run test                   # Run tests
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
