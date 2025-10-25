import { z } from 'zod';

const envSchema = z.object({
  LINEAR_API_KEY_E2E: z.string().optional(),
  LINEAR_TEST_ISSUE_ID: z.string().optional(),
  LINEAR_TEST_TEAM: z.string().default('TES')
});

export const e2eEnv = envSchema.parse(process.env);
