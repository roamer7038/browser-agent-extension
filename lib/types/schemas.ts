import { z } from 'zod';
import type { Message, TokenUsageMetadata, ThreadTokenUsage } from './message';

// Token Usage Schemas
export const TokenUsageMetadataSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
  total_tokens: z.number()
});

export const ThreadTokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  totalTokens: z.number()
});

// Message Schema
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'error', 'tool', 'reasoning', 'system']),
  content: z.string(),
  type: z.enum(['text', 'image', 'tool_call', 'tool_result', 'reasoning', 'system']).optional(),
  name: z.string().optional(),
  usageMetadata: TokenUsageMetadataSchema.optional()
});

// Response Schemas
export const ChatMessageResponseSchema = z.object({
  response: z.string(),
  threadId: z.string(),
  messages: z.array(MessageSchema).optional(),
  screenshots: z.array(z.string()).optional(),
  totalUsage: ThreadTokenUsageSchema.optional()
});

export const ThreadHistoryResponseSchema = z.object({
  messages: z.array(MessageSchema),
  screenshots: z.array(z.string()),
  totalUsage: ThreadTokenUsageSchema.optional()
});

export const ThreadsResponseSchema = z.array(
  z.object({
    id: z.string(),
    updatedAt: z.number(),
    preview: z.string()
  })
);

export const TestMcpConnectionResponseSchema = z.object({
  success: z.boolean(),
  toolCount: z.number().optional(),
  error: z.string().optional()
});

export const FetchModelsResponseSchema = z.object({
  models: z.array(z.string()).optional(),
  error: z.string().optional()
});

export const FetchMcpToolsResponseSchema = z.object({
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        serverName: z.string()
      })
    )
    .optional(),
  error: z.string().optional()
});
