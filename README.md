# Linear CLI

A GitHub CLI-like tool for Linear - manage issues, accounts, and more from your terminal.

## Features

- 🔐 **Multi-account support** - Switch between personal and work accounts
- 📋 **Issue management** - View detailed issue information and PR links
- 🌿 **Branch suggestions** - Get suggested branch names based on issue ID
- 🔒 **Secure storage** - Configuration stored with schema validation
- 🎨 **Beautiful output** - Colorized and formatted output with markdown support

## Installation

```bash
git clone https://github.com/lucasvtiradentes/linear-cli.git
cd linear-cli
pnpm install
pnpm run build
pnpm link --global
```

## Quick Start

1. **Get your Linear API Key** from [Linear Settings](https://linear.app/settings) > Account > API
2. **Add your workspace**: `linear account add`
3. **Test connection**: `linear account test`
4. **View an issue**: `linear issue show WAY-123`

## Usage

### Account Management

```bash
linear account add          # Add workspace
linear account list         # List workspaces
linear account switch work  # Switch workspace
linear account test         # Test connection
```

### Issue Management

```bash
linear issue show WAY-123                    # Show by ID
linear issue show <linear-url>               # Show by URL
linear issue branch WAY-123                  # Get branch name
```

## Configuration

Config file location:

- **Linux/macOS**: `~/.config/linear-cli/config.json5`
- **Windows**: `%APPDATA%\linear-cli\config.json5`

Example configuration:

```json5
{
  $schema: 'https://raw.githubusercontent.com/lucasvtiradentes/linear-cli/main/schema.json',
  workspaces: {
    personal: {
      name: 'personal',
      api_key: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      workspaces: ['your-workspace-slug'],
      default: true
    }
  }
}
```

## Development

```bash
pnpm run dev     # Run in development
pnpm run build   # Build for production
pnpm run test    # Run tests
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
