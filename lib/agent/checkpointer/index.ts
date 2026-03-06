/// <reference types="chrome"/>
import { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
  CheckpointListOptions,
  ChannelVersions,
  PendingWrite
} from '@langchain/langgraph-checkpoint';
import type { Thread } from '@/lib/types/message';

/** Stored checkpoint data shape */
interface StoredCheckpointData {
  checkpoint: Checkpoint;
  metadata: CheckpointMetadata;
  parentConfig: RunnableConfig;
  pendingWrites?: PendingWrite[];
}

/** Raw message from checkpoint channel values */
interface CheckpointMessage {
  content: string | Array<{ text?: string }>;
}

export class ChromeStorageCheckpointer extends BaseCheckpointSaver {
  constructor() {
    super();
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) return undefined;

    const key = `checkpoint:${threadId}`;
    const result = await chrome.storage.local.get(key);
    const stored = result[key] as StoredCheckpointData | undefined;

    if (!stored) return undefined;

    return {
      config,
      checkpoint: stored.checkpoint,
      metadata: stored.metadata,
      parentConfig: stored.parentConfig
    };
  }

  async *list(config: RunnableConfig, options?: CheckpointListOptions): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) return;

    const tuple = await this.getTuple(config);
    if (tuple) {
      yield tuple;
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    if (!threadId) {
      throw new Error('Thread ID is required');
    }

    const key = `checkpoint:${threadId}`;
    const data: StoredCheckpointData = {
      checkpoint,
      metadata,
      parentConfig: config
    };
    await chrome.storage.local.set({ [key]: data });

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_id: checkpoint.id
      }
    };
  }

  async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void> {
    // Optional: Implement if needed for advanced features
    // For now, no-op to satisfy abstract method
  }

  async deleteThread(threadId: string): Promise<void> {
    const key = `checkpoint:${threadId}`;
    await chrome.storage.local.remove(key);
  }

  async getAllThreads(): Promise<Thread[]> {
    const allData = await chrome.storage.local.get(null);
    const threads: Thread[] = [];

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('checkpoint:')) {
        const threadId = key.replace('checkpoint:', '');
        const data = value as StoredCheckpointData;

        let preview = 'No messages';
        const checkpointValues = data.checkpoint as unknown as Record<string, Record<string, unknown>>;
        const messages = checkpointValues?.channel_values?.messages as CheckpointMessage[] | undefined;
        if (Array.isArray(messages) && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          if (typeof lastMsg.content === 'string') {
            preview = lastMsg.content;
          } else if (Array.isArray(lastMsg.content)) {
            preview = lastMsg.content.map((c) => c.text || '').join('');
          }
        }

        threads.push({
          id: threadId,
          updatedAt: data.checkpoint?.ts ? new Date(data.checkpoint.ts as string).getTime() : Date.now(),
          preview: preview.slice(0, 100) + (preview.length > 100 ? '...' : '')
        });
      }
    }

    return threads.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
