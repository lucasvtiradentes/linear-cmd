# Linear CLI

A GitHub CLI-like tool for Linear - manage issues, accounts, and more from your terminal.

## Features

- 🔐 **Multi-account support** - Switch between personal and work accounts
- 📋 **Issue management** - View detailed issue information including title, description, comments, and PR links
- 🌿 **Branch suggestions** - Get suggested branch names based on issue ID and title
- 🎨 **Beautiful output** - Colorized and formatted output with support for markdown
- 🔒 **Secure storage** - Configuration stored in secure JSON5 files with schema validation
- 📝 **Rich help system** - Comprehensive help with examples

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/linear-cmd.git
cd linear-cmd

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Getting Started

### 1. Get your Linear API Key

1. Go to [Linear Settings](https://linear.app/settings)
2. Navigate to **Account** > **API**
3. Create a new API key
4. Copy the key (you'll need it for the next step)

### 2. Configure your workspaces

The CLI uses a configuration file to manage multiple Linear workspaces. You can either:

**Option A: Interactive setup**
```bash
# Add your first workspace
linear account add

# You'll be prompted for:
# - Workspace name (e.g., "personal", "work")
# - Linear API key
```

**Option B: Manual configuration**
Create a configuration file at:
- **Linux/macOS**: `~/.config/linear-cli/config.json5`
- **Windows**: `%APPDATA%\linear-cli\config.json5`

```json5
{
  "$schema": "https://raw.githubusercontent.com/lucasvtiradentes/linear-cli/main/schema.json",
  "workspaces": {
    "personal": {
      "name": "personal",
      "api_key": "lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "workspaces": ["your-workspace-slug"],
      "default": true
    },
    "work": {
      "name": "work",
      "api_key": "lin_api_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
      "team_id": "team_abcd1234",
      "workspaces": ["company-workspace"]
    }
  },
  "settings": {
    "max_results": 50,
    "date_format": "relative",
    "auto_update_workspaces": true
  }
}
```

### 3. Test the connection

```bash
linear account test
```

### 4. View an issue

```bash
# Using issue ID
linear issue show WAY-123

# Using Linear URL
linear issue show https://linear.app/waytech/issue/WAY-11711/qa-allow-the-same-domain-to-be-added-to-different-organizations
```

## Usage

### Workspace Management

```bash
# Add a new workspace
linear account add

# List all workspaces
linear account list

# Switch between workspaces
linear account switch work

# Remove a workspace
linear account remove personal

# Test current workspace connection
linear account test
```

### Issue Management

```bash
# Show detailed issue information
linear issue show WAY-123
linear issue show https://linear.app/team/issue/ABC-456/issue-title

# Get suggested branch name for an issue
linear issue branch WAY-123
```

### Multi-Workspace Workflow

```bash
# Set up multiple workspaces
linear account add  # Add personal workspace
linear account add  # Add work workspace

# Switch between them
linear account switch personal
linear issue show PERSONAL-123

linear account switch work
linear issue show WORK-456
```

## Issue Output Format

When viewing an issue, you'll see:

- **Issue title and ID** with clickable URL
- **Status** with color coding
- **Assignee** information
- **Suggested branch name** (format: `issue-id/kebab-case-title`)
- **Labels** with colors
- **Pull requests** linked to the issue (if any)
- **Description** with markdown formatting
- **Comments** with timestamps and user information
- **Creation and update timestamps**

## API Integration

This tool integrates with Linear's official GraphQL API using the [@linear/sdk](https://www.npmjs.com/package/@linear/sdk) package, ensuring:

- ✅ Official API compatibility
- ✅ Type safety with TypeScript
- ✅ Comprehensive data access
- ✅ Automatic schema updates

## Configuration & Security

### Configuration Structure

The CLI uses a two-level configuration system:

1. **User Metadata** (`user_metadata.json`): Contains workspace references and active workspace info
2. **Main Config** (`config.json5`): Contains workspace configurations with JSON5 syntax support

### Security Features

- Configuration files are stored in OS-specific secure directories
- JSON Schema validation ensures configuration integrity
- Support for multiple workspace configurations
- Workspace isolation for better security

### Configuration Locations

- **Linux**: `~/.config/linear-cli/`
- **macOS**: `~/Library/Application Support/linear-cli/`
- **Windows**: `%APPDATA%\linear-cli\`

### Schema Validation

The configuration includes JSON Schema support for IntelliSense in supported editors:

```json5
{
  "$schema": "https://raw.githubusercontent.com/lucasvtiradentes/linear-cli/main/schema.json",
  // Your configuration...
}
```

## Development

```bash
# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Build for production
npm run build

# Run built version
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Inspiration

This tool is inspired by the excellent [GitHub CLI](https://cli.github.com/) and aims to provide a similar experience for Linear users.
