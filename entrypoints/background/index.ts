// entrypoints/background/index.ts
/// <reference types="chrome"/>
import { createLangGraphAgent } from '@/lib/agent/graph';
import { MCP_SERVERS_STORAGE_KEY } from '@/lib/agent/tools/mcp-types';
import { AgentConfigRepository } from '@/lib/services/storage/repositories/agent-config-repository';
import { LlmProviderRepository } from '@/lib/services/storage/repositories/llm-provider-repository';
import { STORAGE_KEYS } from '@/lib/services/storage/storage-keys';
import { CryptoService } from '@/lib/services/crypto/crypto-service';
import { handleChatMessage } from './handlers/chat-handler';
import { handleGetThreads, handleGetThreadHistory, handleDeleteThread } from './handlers/thread-handler';
import { handleTestMcpConnection, handleFetchMcpTools } from './handlers/mcp-handler';
import { handleFetchModels, handleClearModelCache } from './handlers/model-handler';
import type { AgentExecutorType } from '@/lib/types/agent';
import { onMessage } from '@/lib/messaging';
import { streamManager } from '@/lib/agent/stream-manager';

export default defineBackground(() => {
  // アイコンクリック時にサイドパネルを自動で開く
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  let agentExecutor: AgentExecutorType | null = null;

  // Initialize agent when config changes or on startup if config exists
  const initAgent = async () => {
    const agentConfig = await AgentConfigRepository.getActiveConfig();
    const providers = await LlmProviderRepository.getAll();

    if (agentConfig?.providerId) {
      const provider = providers.find((p) => p.id === agentConfig.providerId);
      if (provider?.apiKey || provider?.providerType === 'ollama') {
        console.log(
          `[Agent Init] Starting initialization for ${provider.providerType} (${agentConfig.modelName || 'default'})...`
        );
        try {
          agentExecutor = await createLangGraphAgent({
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            modelName: agentConfig.modelName,
            providerType: provider.providerType,
            temperature: agentConfig.temperature,
            topP: agentConfig.topP
          });
          console.log('[Agent Init] Agent initialized successfully.');
        } catch (error) {
          console.error('[Agent Init] Failed to initialize agent:', error);
          agentExecutor = null;
        }
      }
    }
  };

  const ensureAgentInitialized = async () => {
    if (!agentExecutor) {
      await initAgent();
      if (!agentExecutor) {
        throw new Error('Agent not initialized. Please set API Key.');
      }
    }
    return agentExecutor;
  };

  chrome.runtime.onInstalled.addListener(async () => {
    try {
      // CryptoServiceを初期化
      await CryptoService.initialize();
      console.log('[Background] Crypto service initialized (onInstalled)');

      // 既存のエージェント初期化
      await initAgent();
    } catch (error) {
      console.error('[Background] Initialization failed (onInstalled):', error);
    }
  });

  chrome.runtime.onStartup.addListener(async () => {
    try {
      // CryptoServiceを初期化
      await CryptoService.initialize();
      console.log('[Background] Crypto service initialized (onStartup)');

      // エージェント初期化も追加
      await initAgent();
    } catch (error) {
      console.error('[Background] Initialization failed (onStartup):', error);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (
      changes[STORAGE_KEYS.LLM_PROVIDERS] ||
      changes[STORAGE_KEYS.AGENT_CONFIGS] ||
      changes[MCP_SERVERS_STORAGE_KEY]
    ) {
      initAgent();
    }
  });

  // ---------------------------------------------------------------------------
  // Message Handlers via @webext-core/messaging
  // ---------------------------------------------------------------------------

  onMessage('chat_message', async (message) => {
    const executor = await ensureAgentInitialized();
    return await handleChatMessage(message.data, executor);
  });

  onMessage('get_threads', async () => {
    const result = await handleGetThreads();
    return result.threads;
  });

  onMessage('get_thread_history', async (message) => {
    const executor = await ensureAgentInitialized();
    return await handleGetThreadHistory(message.data, executor);
  });

  onMessage('delete_thread', async (message) => {
    const result = await handleDeleteThread(message.data);
    if (!result.success) throw new Error('Failed to delete thread');
  });

  onMessage('cancel_generation', async (message) => {
    const success = streamManager.abortStream(message.data);
    if (success) {
      return { success: true };
    }
    return { error: 'Stream not found' };
  });

  onMessage('test_mcp_connection', async (message) => {
    return await handleTestMcpConnection(message.data);
  });

  onMessage('fetch_models', async (message) => {
    let provider = message.data;
    if (!provider) {
      const agentConfig = await AgentConfigRepository.getActiveConfig();
      if (!agentConfig?.providerId) {
        return { error: 'No LLM Provider selected in Agent Settings' };
      }
      const providers = await LlmProviderRepository.getAll();
      const storedProvider = providers.find((p) => p.id === agentConfig.providerId);
      if (!storedProvider) {
        return { error: 'Selected LLM Provider not found' };
      }
      provider = storedProvider;
    }
    try {
      const result = await handleFetchModels(provider);
      return { models: result.models };
    } catch (e: any) {
      return { error: e.message || 'Error fetching models' };
    }
  });

  onMessage('clear_model_cache', async () => {
    await handleClearModelCache();
    return { success: true };
  });

  onMessage('fetch_mcp_tools', async (message) => {
    try {
      const result = await handleFetchMcpTools(message.data);
      return { tools: result.tools };
    } catch (e: any) {
      return { error: e.message || 'Error fetching MCP tools' };
    }
  });

  // Handle long-lived connections for streaming
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'chat_stream') {
      port.onDisconnect.addListener(() => {
        streamManager.clearDisconnectedPort(port);
      });

      port.onMessage.addListener(async (request) => {
        try {
          const executor = await ensureAgentInitialized();

          if (request.type === 'chat_message') {
            await handleChatMessage(request, executor, port);
          } else if (request.type === 'reconnect_stream') {
            const streamState = streamManager.getStream(request.threadId);
            if (streamState) {
              streamManager.updatePort(request.threadId, port);
              port.postMessage({ type: 'stream_reconnected' });
            } else {
              port.postMessage({ type: 'stream_not_found' });
            }
          }
        } catch (error: any) {
          console.error('Port message handler error:', error);
          port.postMessage({ type: 'error', error: error.message || 'Internal error' });
        }
      });
    }
  });
});
