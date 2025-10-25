import './load-env';

import { beforeEach } from 'vitest';
import { e2eEnv } from './utils/e2e-env';

beforeEach(() => {
  if (!e2eEnv.LINEAR_API_KEY_E2E) {
    throw new Error('LINEAR_API_KEY_E2E is required for E2E tests. Please set it in .env.e2e file.');
  }

  if (!e2eEnv.LINEAR_TEST_ISSUE_ID) {
    throw new Error('LINEAR_TEST_ISSUE_ID is required for E2E tests. Please set it in .env.e2e file.');
  }
});
