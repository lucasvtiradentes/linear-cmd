# Linear CLI

A GitHub CLI-like tool for Linear - manage issues, accounts, and more from your terminal.

## Features

- 🔐 **Multi-account support** - Switch between personal and work accounts
- 📋 **Issue management** - View detailed issue information including title, description, comments, and PR links
- 🌿 **Branch suggestions** - Get suggested branch names based on issue ID and title
- 🎨 **Beautiful output** - Colorized and formatted output with support for markdown
- 🔒 **Secure storage** - API keys stored securely using keytar
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

### 2. Add your first account

```bash
# Add your personal account
linear account add

# You'll be prompted for:
# - Account name (e.g., "personal", "work")
# - Linear API key
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

### Account Management

```bash
# Add a new account
linear account add

# List all accounts
linear account list

# Switch between accounts
linear account switch work

# Remove an account
linear account remove personal

# Test current account connection
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

### Multi-Account Workflow

```bash
# Set up multiple accounts
linear account add  # Add personal account
linear account add  # Add work account

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

## Security

- API keys are stored securely using [keytar](https://www.npmjs.com/package/keytar)
- Keys are never stored in plain text configuration files
- Each account's API key is encrypted and stored in the system keychain

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