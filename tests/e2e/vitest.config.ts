import path from 'path';
import { mergeConfig } from 'vitest/config';

import { baseConfig } from '../../vitest.config.base';

export default mergeConfig(baseConfig, {
  test: {
    name: 'e2e',
    include: ['tests/e2e/**/*.e2e.test.ts'],
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    testTimeout: 60000, // 1 minute for API calls
    coverage: {
      reportsDirectory: '../../coverage/e2e'
    },
    // Run E2E tests sequentially to avoid API rate limits
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
});
