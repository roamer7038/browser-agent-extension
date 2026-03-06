import { createAgent } from 'langchain';
import type { BaseMessage } from '@langchain/core/messages';
import type { LlmProviderType } from '@/lib/agent/llm/types';

export type AgentExecutorType = ReturnType<typeof createAgent>;

export interface ChatRequestMessage {
  message: BaseMessage | Record<string, unknown> | string;
  threadId?: string;
}

import { z } from 'zod';

export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

export const LlmProviderConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  providerType: z.string(),
  baseUrl: z.string().optional(),
  apiKey: z.string()
});
export type LlmProviderConfig = z.infer<typeof LlmProviderConfigSchema>;

export const AgentSettingsConfigSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  providerId: z.string(),
  modelName: z.string(),
  enabledTools: z.array(z.string()),
  enabledMcpServers: z.array(z.string()),
  disabledMcpTools: z.array(z.string()),
  systemPrompt: z.string().optional(),
  enabledMiddlewares: z.array(z.string()),
  middlewareSettings: z
    .object({
      summarization: z.object({ maxTokens: z.number().optional() }).optional(),
      toolCallLimit: z.object({ runLimit: z.number().optional() }).optional()
    })
    .optional(),
  recursionLimit: z.number().optional(),
  temperature: z.number().optional(),
  topP: z.number().optional()
});
export type AgentSettingsConfig = z.infer<typeof AgentSettingsConfigSchema>;

/** Default agent identifier used when no specific agent is specified. */
export const DEFAULT_AGENT_ID = 'default';

/** Lightweight tool info returned from MCP server discovery. */
export interface McpToolInfo {
  name: string;
  description: string;
  serverName: string;
}

export const McpServerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  transport: z.enum(['sse', 'http']),
  headers: z.record(z.string(), z.string())
});
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

/** Result of an MCP server connection test. */
export interface TestResult {
  success: boolean;
  toolCount?: number;
  error?: string;
}

/** Configuration passed to createLangGraphAgent. */
export interface GraphAgentConfig {
  apiKey: string;
  baseUrl?: string;
  modelName: string;
  providerType?: LlmProviderType;
  temperature?: number;
  topP?: number;
}
