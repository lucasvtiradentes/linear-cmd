import { z } from 'zod';

// Local application schemas (non-Linear API related)

// User metadata file structure
export const userMetadataSchema = z.object({
  config_path: z.string(),
  active_account: z.string().optional()
});

// Account schema
export const accountSchema = z.object({
  name: z.string(),
  api_key: z.string(),
  team_id: z.string().optional(),
  workspaces: z.array(z.string()).optional()
});

// Linear CLI configuration schema
export const linearConfigSchema = z.object({
  $schema: z.string().optional(),
  accounts: z.record(z.string(), accountSchema),
  settings: z
    .object({
      max_results: z.number().default(50),
      date_format: z.enum(['iso', 'local', 'relative']).default('relative'),
      auto_update_accounts: z.boolean().default(true)
    })
    .optional()
});

// Issue data structure (for local processing/display)
export const issueDataSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional(),
  branchName: z.string(),
  state: z.object({
    name: z.string(),
    color: z.string()
  }),
  assignee: z
    .object({
      name: z.string(),
      email: z.string()
    })
    .optional(),
  labels: z.array(
    z.object({
      name: z.string(),
      color: z.string()
    })
  ),
  comments: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      user: z.object({
        name: z.string(),
        email: z.string()
      }),
      createdAt: z.date()
    })
  ),
  pullRequests: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      title: z.string(),
      number: z.number(),
      draft: z.boolean(),
      merged: z.boolean(),
      branch: z.string()
    })
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
  url: z.string()
});

// Export types using z.infer
export type UserMetadata = z.infer<typeof userMetadataSchema>;
export type Account = z.infer<typeof accountSchema>;
export type LinearConfig = z.infer<typeof linearConfigSchema>;
export type IssueData = z.infer<typeof issueDataSchema>;
