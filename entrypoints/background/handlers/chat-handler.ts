// entrypoints/background/handlers/chat-handler.ts
/// <reference types="chrome"/>
import { v4 as uuidv4 } from 'uuid';
import { SystemMessage } from '@langchain/core/messages';
import type { ChatMessageResponse } from '@/lib/types/message';
import type { StreamMessage } from '@/lib/types/stream';
import { AgentConfigRepository } from '@/lib/services/storage/repositories/agent-config-repository';
import { ThreadRepository } from '@/lib/services/storage/repositories/thread-repository';
import { ScreenshotRepository } from '@/lib/services/storage/repositories/screenshot-repository';
import { mapRawMessages } from '@/lib/agent/message-mapper';
import { getLatestTokenUsage } from '@/lib/agent/token-calculator';
import { processStreamEvents } from '@/lib/agent/stream-processor';
import { streamManager } from '@/lib/agent/stream-manager';
import type { AgentExecutorType, ChatRequestMessage } from '@/lib/types/agent';

const DEFAULT_RECURSION_LIMIT = 100;

/** Thread configuration for LangGraph */
interface ThreadConfig {
  configurable: { thread_id: string };
}

/** Sends a typed stream message to the active port */
function postStreamMessage(threadId: string, message: StreamMessage): void {
  streamManager.getPort(threadId)?.postMessage(message);
}

async function processLangGraphStream(
  message: ChatRequestMessage['message'],
  actualThreadId: string,
  config: ThreadConfig,
  recursionLimit: number,
  agentExecutor: AgentExecutorType,
  port: chrome.runtime.Port
): Promise<void> {
  const abortController = streamManager.createStream(actualThreadId, port);
  const getActivePort = () => streamManager.getPort(actualThreadId);

  postStreamMessage(actualThreadId, { type: 'stream_start', threadId: actualThreadId });

  try {
    const eventStream = await agentExecutor.streamEvents(
      { messages: [message] },
      { version: 'v2', recursionLimit, signal: abortController.signal, ...config }
    );

    await processStreamEvents(eventStream, getActivePort());

    // Retrieve screenshot data URL if captured during this turn
    const screenshotDataUrl = await ScreenshotRepository.getLastDataUrl();
    if (screenshotDataUrl && actualThreadId) {
      await ScreenshotRepository.saveForThread(actualThreadId, screenshotDataUrl);
      await ScreenshotRepository.removeLastDataUrl();
    }

    // We need the final state to return everything structured properly.
    const currentState = await agentExecutor.getState(config);
    const stateValues = (currentState as Record<string, unknown>).values || {};
    const rawMessages = (stateValues as Record<string, unknown>).messages || [];
    const messages = mapRawMessages(rawMessages as unknown[]);
    const totalUsage = getLatestTokenUsage(messages);

    const screenshots = await ScreenshotRepository.getForThread(actualThreadId);

    postStreamMessage(actualThreadId, {
      type: 'stream_end',
      response: {
        response: messages.length > 0 ? messages[messages.length - 1].content : '',
        messages,
        screenshots,
        threadId: actualThreadId,
        totalUsage
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Stream aborted by user');
      postStreamMessage(actualThreadId, { type: 'stream_abort' });
    } else {
      const errorMessage = (error instanceof Error ? error.message : String(error)) || 'Stream failed';
      console.error('Streaming error:', error);
      postStreamMessage(actualThreadId, { type: 'error', error: errorMessage });
      try {
        await agentExecutor.updateState(config, {
          messages: [new SystemMessage({ content: `[Error] ${errorMessage}` })]
        });
      } catch (e) {
        console.error('Failed to update state with error:', e);
      }
    }
  } finally {
    streamManager.deleteStream(actualThreadId);
  }
}

async function processLegacyChat(
  message: ChatRequestMessage['message'],
  actualThreadId: string,
  config: ThreadConfig,
  recursionLimit: number,
  agentExecutor: AgentExecutorType
): Promise<ChatMessageResponse> {
  const result = await agentExecutor.invoke({ messages: [message] }, { recursionLimit, ...config });

  const lastMessage = result.messages[result.messages.length - 1];

  const screenshotDataUrl = await ScreenshotRepository.getLastDataUrl();
  if (screenshotDataUrl) {
    await ScreenshotRepository.saveForThread(actualThreadId, screenshotDataUrl);
    await ScreenshotRepository.removeLastDataUrl();
  }

  const rawMessages = result.messages || [];
  const messages = mapRawMessages(rawMessages);
  const totalUsage = getLatestTokenUsage(messages);
  const screenshots = await ScreenshotRepository.getForThread(actualThreadId);

  return {
    response: lastMessage.content,
    messages,
    screenshots,
    threadId: actualThreadId,
    totalUsage
  };
}

export async function handleChatMessage(
  request: ChatRequestMessage,
  agentExecutor: AgentExecutorType,
  port?: chrome.runtime.Port
): Promise<ChatMessageResponse | void> {
  const { message, threadId } = request;
  const config: ThreadConfig = { configurable: { thread_id: threadId || uuidv4() } };
  const actualThreadId = String(config.configurable.thread_id);

  const agentSettings = await AgentConfigRepository.getActiveConfig();
  const recursionLimit = agentSettings?.recursionLimit || DEFAULT_RECURSION_LIMIT;

  if (actualThreadId) {
    await ThreadRepository.setLastActiveId(actualThreadId);
  }

  if (port) {
    return processLangGraphStream(message, actualThreadId, config, recursionLimit, agentExecutor, port);
  }

  return processLegacyChat(message, actualThreadId, config, recursionLimit, agentExecutor);
}
