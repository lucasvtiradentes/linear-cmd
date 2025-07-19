import { mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.base';

export default mergeConfig(baseConfig, {
  test: {
    setupFiles: ['./tests/vitest-setup.ts', './tests/setup.ts'],
    testTimeout: 30000,
    // Include only unit tests by default
    include: ['tests/unit/**/*.test.ts']
  }
});