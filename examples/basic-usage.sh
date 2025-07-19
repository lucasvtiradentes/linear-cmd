#!/usr/bin/env bash

# Basic Linear CLI Usage Examples

echo "=== Linear CLI Basic Usage Examples ==="
echo ""

# Account management
echo "1. Add a new Linear account:"
echo "   linear account add"
echo ""

echo "2. List all configured accounts:"
echo "   linear account list"
echo ""

echo "3. Remove an account:"
echo "   linear account remove myaccount"
echo ""

echo "4. Test accounts:"
echo "   linear account test"
echo ""

# Issue management
echo "5. Show a specific issue:"
echo "   linear issue show LIN-123"
echo "   linear issue show https://linear.app/team/issue/LIN-123"
echo ""

echo "6. Create a branch for an issue:"
echo "   linear issue branch LIN-123"
echo "   linear issue branch https://linear.app/team/issue/LIN-123"
echo ""

# Using with multiple accounts
echo "7. Show issue from specific account:"
echo "   linear issue show LIN-123 --account work"
echo "   linear issue show LIN-456 --account personal"
echo ""

echo "=== Run any command with --help for more options ==="
echo "linear --help"
echo "linear issue --help"
echo "linear account --help"