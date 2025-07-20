import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src')
    }
  },
  test: {
    name: 'integration',
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    testTimeout: 30000
  }
});
