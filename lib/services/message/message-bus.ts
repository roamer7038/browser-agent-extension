// lib/services/message/message-bus.ts
import { sendMessage } from '@/lib/messaging';
import type { Thread, ThreadHistory, ChatMessageResponse } from '@/lib/types/message';
import type { McpServerConfig, TestResult, McpToolInfo } from '@/lib/types/agent';

export class MessageBus {
  static async sendChatMessage(message: any, threadId?: string): Promise<ChatMessageResponse> {
    const res = await sendMessage('chat_message', { message, threadId });
    if (!res) throw new Error('No response from sendChatMessage');
    return res;
  }

  static async getThreads(): Promise<Thread[]> {
    return sendMessage('get_threads', undefined);
  }

  static async getThreadHistory(threadId: string): Promise<ThreadHistory> {
    return sendMessage('get_thread_history', threadId);
  }

  static async deleteThread(threadId: string): Promise<void> {
    await sendMessage('delete_thread', threadId);
  }

  static async testMcpConnection(server: McpServerConfig): Promise<TestResult> {
    return sendMessage('test_mcp_connection', server);
  }

  static async fetchModels(): Promise<string[]> {
    const response = await sendMessage('fetch_models', undefined);
    if ('error' in response) {
      throw new Error(response.error);
    }
    return response.models || [];
  }

  static async clearModelCache(): Promise<void> {
    await sendMessage('clear_model_cache', undefined);
  }

  static async fetchMcpTools(serverId: string): Promise<McpToolInfo[]> {
    const response = await sendMessage('fetch_mcp_tools', serverId);
    if ('error' in response) {
      throw new Error(response.error);
    }
    return response.tools || [];
  }
}
