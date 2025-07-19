#!/usr/bin/env bash

# Advanced Linear CLI Workflow Examples

echo "=== Linear CLI Advanced Workflow Examples ==="
echo ""

# Example 1: Daily workflow
echo "Example 1: Daily Workflow"
echo "------------------------"
echo "# Show specific issues"
echo "linear issue show LIN-123"
echo "linear issue show LIN-124"
echo ""
echo "# Create branches for issues"
echo "linear issue branch LIN-123"
echo "linear issue branch LIN-124"
echo ""

# Example 2: Multi-project workflow
echo "Example 2: Multi-Project Workflow"
echo "---------------------------------"
echo "# Test all accounts are working"
echo "linear account test"
echo ""
echo "# Show issue from work project"
echo "linear issue show WORK-123 --account work"
echo ""
echo "# Show issue from personal project"
echo "linear issue show PERSONAL-456 --account personal"
echo ""

# Example 3: Account management
echo "Example 3: Account Management"
echo "-----------------------------"
echo "# List all accounts"
echo "linear account list"
echo ""
echo "# Add a new account"
echo "linear account add"
echo ""
echo "# Remove an old account"
echo "linear account remove oldaccount"
echo ""

# Example 4: Shell script automation
echo "Example 4: Shell Script Automation"
echo "---------------------------------"
echo "# Create a function to show issue and create branch"
echo "work_on_issue() {"
echo "  linear issue show \"\$1\""
echo "  linear issue branch \"\$1\""
echo "}"
echo ""
echo "# Use it"
echo "work_on_issue 'LIN-123'"
echo ""

echo "=== Pro Tips ==="
echo "- Use --account flag to work with multiple accounts"
echo "- URLs and issue IDs both work for show/branch commands"
echo "- Run 'linear account test' to verify all accounts are working"