// lib/types/stream.ts

import type { MappedMessage } from '@/lib/agent/message-mapper';

/** Chunk data sent during streaming */
export interface StreamChunkData {
  content: string;
  tool_call_chunks: unknown[];
  additional_kwargs: Record<string, unknown>;
}

/** Response payload at the end of a stream */
export interface StreamEndResponse {
  response: string;
  messages: MappedMessage[];
  screenshots: string[];
  threadId: string;
  totalUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/** Union of all stream messages sent from background to sidepanel via Port */
export type StreamMessage =
  | { type: 'stream_start'; threadId: string }
  | { type: 'stream_chunk'; chunk: StreamChunkData }
  | { type: 'tool_start'; name: string; input: unknown }
  | { type: 'tool_end'; name: string; output: unknown }
  | { type: 'stream_end'; response: StreamEndResponse }
  | { type: 'stream_abort' }
  | { type: 'stream_reconnected' }
  | { type: 'stream_not_found' }
  | { type: 'error'; error: string };

/** Request messages sent from sidepanel to background via Port */
export type StreamRequest =
  | { type: 'chat_message'; message: { role: string; content: string }; threadId: string }
  | { type: 'reconnect_stream'; threadId: string };
