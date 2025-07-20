import path from 'path';
import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/vitest-setup.ts', './tests/setup.ts'],
    testTimeout: 30000,
    // Include only unit tests by default
    include: ['tests/unit/**/*.test.ts']
  }
};

export default defineConfig(config);
