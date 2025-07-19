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
  debug: vi.fn(),
};

// Mock keytar globally for integration tests
vi.mock('keytar', () => {
  const passwordStore = new Map<string, string>();
  
  return {
    setPassword: vi.fn(async (service: string, account: string, password: string) => {
      passwordStore.set(`${service}:${account}`, password);
    }),
    getPassword: vi.fn(async (service: string, account: string) => {
      return passwordStore.get(`${service}:${account}`) || null;
    }),
    deletePassword: vi.fn(async (service: string, account: string) => {
      const existed = passwordStore.has(`${service}:${account}`);
      passwordStore.delete(`${service}:${account}`);
      return existed;
    }),
    default: {
      setPassword: vi.fn(),
      getPassword: vi.fn(),
      deletePassword: vi.fn()
    }
  };
});

// Note: Integration tests now use direct imports with targeted mocks
// instead of global mocks to have better control over test scenarios