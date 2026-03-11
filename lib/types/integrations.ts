import { z } from 'zod';

export const IntegrationConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean().default(false),
  apiKey: z.string().optional(),
  // For provider-specific configurations
  settings: z.record(z.string(), z.any()).optional()
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;
