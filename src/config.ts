import { z } from 'zod';

// User metadata file structure
export const userMetadataSchema = z.object({
  config_path: z.string(),
  active_workspace: z.string().optional()
});

export type UserMetadata = z.infer<typeof userMetadataSchema>;

// Main config file structure
export const workspaceConfigSchema = z.object({
  name: z.string(),
  api_key: z.string(),
  team_id: z.string().optional(),
  workspaces: z.array(z.string()).optional(),
  default: z.boolean().optional()
});

export const linearConfigSchema = z.object({
  $schema: z.string().optional(),
  workspaces: z.record(z.string(), workspaceConfigSchema),
  settings: z
    .object({
      max_results: z.number().default(50),
      date_format: z.enum(['iso', 'local', 'relative']).default('relative'),
      auto_update_workspaces: z.boolean().default(true)
    })
    .optional()
});

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;
export type LinearConfig = z.infer<typeof linearConfigSchema>;

// Legacy account interface for backward compatibility
export interface Account {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  workspaces?: string[];
}

// Issue data structure
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

export type IssueData = z.infer<typeof issueDataSchema>;

// Legacy account interface for backward compatibility
export interface Account {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  workspaces?: string[];
}

// Legacy config interface for backward compatibility
export interface Config {
  accounts: Account[];
  activeAccountId?: string;
}
