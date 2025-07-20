import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src')
    }
  },
  test: {
    name: 'unit',
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: [path.resolve(__dirname, './vitest-setup.ts'), path.resolve(__dirname, './setup.ts')],
    testTimeout: 10000
  }
});
