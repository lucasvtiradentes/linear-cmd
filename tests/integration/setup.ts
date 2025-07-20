import { vi, beforeEach } from 'vitest';

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
  const actual = await vi.importActual<typeof import('fs')>('fs');
  const mockFileSystem = new Map<string, string>();
  
  // Setup mock package.json for constants.ts
  const packageJsonPath = '/home/lucas/_custom/repos/github_lucasvtiradentes/linear-cli/package.json';
  mockFileSystem.set(packageJsonPath, JSON.stringify({
    name: 'linear-cmd',
    version: '1.0.1'
  }));

  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Always return true for package.json to avoid path resolution issues
      if (path.endsWith('package.json')) return true;
      return mockFileSystem.has(path);
    }),
    readFileSync: vi.fn((path: string) => {
      // Handle package.json specially
      if (path.endsWith('package.json')) {
        return JSON.stringify({
          name: 'linear-cmd',
          version: '1.0.1'
        });
      }
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
