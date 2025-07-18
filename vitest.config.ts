import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/vitest-setup.ts', './src/__tests__/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    },
    testTimeout: 30000, // 30s for E2E tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});