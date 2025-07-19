import path from 'path';
import { mergeConfig } from 'vitest/config';

import { baseConfig } from '../../vitest.config.base';

export default mergeConfig(baseConfig, {
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.integration.test.ts'],
    setupFiles: [path.resolve(__dirname, './setup.ts')],
    testTimeout: 30000,
    coverage: {
      reportsDirectory: '../../coverage/integration'
    }
  }
});
