import path from 'path';
import { mergeConfig } from 'vitest/config';

import { baseConfig } from '../../vitest.config.base';

export default mergeConfig(baseConfig, {
  test: {
    name: 'unit',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: [path.resolve(__dirname, './vitest-setup.ts'), path.resolve(__dirname, './setup.ts')],
    testTimeout: 10000,
    coverage: {
      reportsDirectory: '../../coverage/unit'
    }
  }
});
