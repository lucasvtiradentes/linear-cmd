import path from 'path';
import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
});
