import { defineExtensionMessaging } from '@webext-core/messaging';
import type { ChatRequestMessage, McpServerConfig, LlmProviderConfig } from '@/lib/types/agent';
import type { ChatMessageResponse, ThreadHistory, Thread } from '@/lib/types/message';
import type { TestResult, McpToolInfo } from '@/lib/types/agent';

export interface ProtocolMap {
  chat_message(request: ChatRequestMessage): Promise<ChatMessageResponse | void>;
  get_threads(): Promise<Thread[]>;
  get_thread_history(threadId: string): Promise<ThreadHistory>;
  delete_thread(threadId: string): Promise<void>;
  cancel_generation(threadId: string): Promise<{ success: boolean } | { error: string }>;
  test_mcp_connection(server: McpServerConfig): Promise<TestResult>;
  fetch_models(provider?: LlmProviderConfig): Promise<{ models?: string[]; error?: string }>;
  clear_model_cache(): Promise<{ success: boolean }>;
  fetch_mcp_tools(serverId: string): Promise<{ tools?: McpToolInfo[]; error?: string }>;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
