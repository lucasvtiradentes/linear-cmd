import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'], // Only setup, no mocks
    testTimeout: 30000,
    include: ['src/__tests__/e2e/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});