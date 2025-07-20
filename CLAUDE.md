# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build & Development
- `npm run build` - Build TypeScript to dist/
- `npm run dev` - Run TypeScript directly with tsx
- `npm run typecheck` - Check TypeScript types without emitting

### Testing
- `npm run test:unit` - Run unit tests once
- `npm run test:integration` - Run integration tests (30s timeout)
- `npm run test:e2e` - Run E2E tests (requires LINEAR_API_KEY_E2E env var, 60s timeout)

### Linting & Formatting
- `npm run lint` - Run Biome linter with auto-fix
- `npm run format` - Format code with Biome

## Architecture Overview

This is a CLI tool for Linear.app that provides GitHub CLI-like functionality. Key architectural decisions:

### Command Structure
Commands follow a hierarchical pattern using Commander.js:
- `linear account [add|list|remove|test]` - Account management
- `linear issue [show|create|list|update|comment]` - Issue operations  
- `linear update` - Self-update functionality

Each command is modular and self-contained in `src/commands/`.

### Configuration Management
The `ConfigManager` class handles all configuration:
- Configs stored in OS-specific directories (Linux: `~/.config/linear-cmd/`)
- Uses JSON5 format for human-readable configs
- Two-tier system: `user_metadata.json` points to active `config.json5`
- Supports multiple Linear accounts with automatic workspace detection

### Linear API Integration
The `LinearAPIClient` wraps the official `@linear/sdk`:
- Smart account detection from issue URLs
- Workspace caching for optimal account selection
- API keys stored securely in local config

### Type Safety
- Uses Zod for runtime validation and type generation
- Strict TypeScript configuration
- Clear separation between Linear API types and internal types

### Testing Strategy
Three-tier testing approach:
- Unit tests: Fast, isolated component tests
- Integration tests: Component interaction tests
- E2E tests: Full command flows with real API (run sequentially to avoid rate limits)

### Key Design Patterns
- Command Pattern for CLI commands
- Singleton Pattern for ConfigManager
- Adapter Pattern for LinearAPIClient
- Repository Pattern for account data management

## Important Notes

- Always check for existing patterns before implementing new features
- The project uses Biome for linting/formatting, not ESLint/Prettier
- Tests run sequentially in E2E to avoid Linear API rate limits
- Multi-account support is a core feature - maintain compatibility
- Error messages should be user-friendly with helpful hints
- Cross-platform compatibility is required (Linux, macOS, Windows, WSL)