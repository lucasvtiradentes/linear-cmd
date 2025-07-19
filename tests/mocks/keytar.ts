import { vi } from 'vitest';

// Mock storage for passwords
const passwordStore = new Map<string, string>();

export const keytarMock = {
  setPassword: vi.fn(async (service: string, account: string, password: string) => {
    const key = `${service}:${account}`;
    passwordStore.set(key, password);
    return Promise.resolve();
  }),

  getPassword: vi.fn(async (service: string, account: string) => {
    const key = `${service}:${account}`;
    return Promise.resolve(passwordStore.get(key) || null);
  }),

  deletePassword: vi.fn(async (service: string, account: string) => {
    const key = `${service}:${account}`;
    const existed = passwordStore.has(key);
    passwordStore.delete(key);
    return Promise.resolve(existed);
  }),

  // Helper methods for testing
  clear: () => {
    passwordStore.clear();
  },

  getStore: () => new Map(passwordStore)
};

// Mock the keytar module
vi.mock('keytar', () => ({
  default: keytarMock,
  ...keytarMock
}));
