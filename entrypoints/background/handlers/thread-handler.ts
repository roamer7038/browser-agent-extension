// entrypoints/background/handlers/thread-handler.ts
/// <reference types="chrome"/>
import { ChromeStorageCheckpointer } from '@/lib/agent/checkpointer';
import { ThreadRepository } from '@/lib/services/storage/repositories/thread-repository';
import { ScreenshotRepository } from '@/lib/services/storage/repositories/screenshot-repository';
import { mapRawMessages } from '@/lib/agent/message-mapper';
import { getLatestTokenUsage } from '@/lib/agent/token-calculator';
import type { Thread, ThreadHistory } from '@/lib/types/message';
import type { AgentExecutorType } from '@/lib/types/agent';

export async function handleGetThreads(): Promise<{ threads: Thread[] }> {
  const checkpointer = new ChromeStorageCheckpointer();
  const threads = await checkpointer.getAllThreads();
  return { threads };
}

export async function handleGetThreadHistory(
  threadId: string,
  agentExecutor: AgentExecutorType
): Promise<ThreadHistory> {
  const config = { configurable: { thread_id: threadId } };
  const state = await agentExecutor.getState(config);

  // Extract messages from state safely as ReturnType<createAgent> might obscure the values property.
  const stateValues = (state as Record<string, unknown>).values || {};
  const rawMessages = ((stateValues as Record<string, unknown>).messages || []) as unknown[];
  const messages = mapRawMessages(rawMessages);

  // Extract token usage using shared utility
  const totalUsage = getLatestTokenUsage(messages);

  // Get screenshots for this thread
  const screenshots = await ScreenshotRepository.getForThread(threadId);

  return { messages, screenshots, totalUsage };
}

export async function handleDeleteThread(threadId: string): Promise<{ success: true }> {
  const checkpointer = new ChromeStorageCheckpointer();
  await checkpointer.deleteThread(threadId);

  // If deleting active thread, clear it
  const lastActiveThreadId = await ThreadRepository.getLastActiveId();
  if (lastActiveThreadId === threadId) {
    await ThreadRepository.removeLastActiveId();
  }

  // Related screenshots cleanup
  await ScreenshotRepository.removeForThread(threadId);

  return { success: true };
}
