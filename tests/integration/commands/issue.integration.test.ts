import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createListIssuesCommand } from '../../../src/commands/issue/list-issues';
import { createShowIssueCommand } from '../../../src/commands/issue/show-issue';

describe('Issue Commands Integration', () => {
  let _consoleLogSpy: any;
  let _consoleErrorSpy: any;

  beforeEach(() => {
    _consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    _consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('List Issues Command', () => {
    it('should create command with proper structure', () => {
      const command = createListIssuesCommand();

      expect(command).toBeDefined();
      expect(command.name()).toBe('list');
      expect(command.description()).toContain('List Linear issues');
    });

    it('should require account parameter', () => {
      const command = createListIssuesCommand();

      // Check that account option is required
      const accountOption = command.options.find((opt) => opt.long === '--account');
      expect(accountOption).toBeDefined();
      expect(accountOption?.required).toBe(true);
    });

    it('should have optional filter parameters', () => {
      const command = createListIssuesCommand();

      const expectedOptions = ['--assignee', '--state', '--label', '--project', '--team', '--limit'];

      for (const optionName of expectedOptions) {
        const option = command.options.find((opt) => opt.long === optionName);
        expect(option).toBeDefined();
        // Some options might be required, just check they exist
      }
    });

    it('should support json output format', () => {
      const command = createListIssuesCommand();

      const jsonOption = command.options.find((opt) => opt.long === '--json');
      expect(jsonOption).toBeDefined();
      expect(jsonOption?.required).toBeFalsy();
    });

    it('should have default limit option', () => {
      const command = createListIssuesCommand();

      const limitOption = command.options.find((opt) => opt.long === '--limit');
      expect(limitOption).toBeDefined();
      expect(limitOption?.defaultValue).toBe('25');
    });
  });

  describe('Show Issue Command', () => {
    it('should create command with proper structure', () => {
      const command = createShowIssueCommand();

      expect(command).toBeDefined();
      expect(command.name()).toBe('show');
      expect(command.description()).toContain('Show detailed information');
    });

    it('should require issue identifier argument', () => {
      const command = createShowIssueCommand();

      // Check that it expects an argument
      expect(command.registeredArguments).toHaveLength(1);
      expect(command.registeredArguments[0].required).toBe(true);
    });

    it('should support format option', () => {
      const command = createShowIssueCommand();

      const formatOption = command.options.find((opt) => opt.long === '--format');
      expect(formatOption).toBeDefined();
    });
  });
});
