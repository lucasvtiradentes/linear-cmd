import { z } from 'zod';

const envSchema = z.object({
  LINEAR_API_KEY_E2E: z.string(),
  LINEAR_TEST_ISSUE_ID: z.string(),
  LINEAR_TEST_TEAM: z.string()
});

export const e2eEnv = envSchema.parse(process.env);
