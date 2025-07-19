import * as dotenv from 'dotenv';
import * as path from 'path';
import { vi, beforeEach } from 'vitest';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset modules to ensure clean state
  vi.resetModules();
});

// Mock console methods during tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Mock filesystem for integration tests
vi.mock('fs', async () => {
  const actual = (await vi.importActual('fs')) as any;
  const mockFileSystem = new Map<string, string>();

  return {
    ...actual,
    existsSync: vi.fn((path: string) => mockFileSystem.has(path)),
    readFileSync: vi.fn((path: string) => {
      const content = mockFileSystem.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content;
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      mockFileSystem.set(path, content);
    }),
    mkdirSync: vi.fn()
  };
});

// Note: Integration tests now use direct imports with targeted mocks
// instead of global mocks to have better control over test scenarios
