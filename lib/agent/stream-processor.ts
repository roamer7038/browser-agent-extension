/// <reference types="chrome"/>

import type { StreamMessage } from '@/lib/types/stream';

/** Stream event from LangGraph */
interface LangGraphStreamEvent {
  event: string;
  name?: string;
  data: Record<string, unknown>;
}

/**
 * Processes stream events from LangGraph and posts messages to the active Chrome Port.
 */
export async function processStreamEvents(
  eventStream: AsyncIterable<LangGraphStreamEvent>,
  port: chrome.runtime.Port | null | undefined
): Promise<void> {
  const postMessage = (msg: StreamMessage): void => {
    port?.postMessage(msg);
  };

  for await (const { event, name, data } of eventStream) {
    if (event === 'on_chain_start' && name) {
      console.log(`[LangGraph Step] 🟢 Node Start: ${name}`, data);
    } else if (event === 'on_chain_end' && name) {
      console.log(`[LangGraph Step] 🔴 Node End: ${name}`, data);
    } else if (event === 'on_chat_model_stream' && data.chunk) {
      const chunk = data.chunk as Record<string, unknown>;
      postMessage({
        type: 'stream_chunk',
        chunk: {
          content: (chunk.content as string) || '',
          tool_call_chunks: (chunk.tool_call_chunks as unknown[]) || [],
          additional_kwargs: (chunk.additional_kwargs as Record<string, unknown>) || {}
        }
      });
    } else if (event === 'on_tool_start') {
      console.log(`[LangGraph Step] 🛠️ Tool Start: ${name}`, data.input);
      postMessage({
        type: 'tool_start',
        name: name || '',
        input: data.input
      });
    } else if (event === 'on_tool_end') {
      console.log(`[LangGraph Step] ✅ Tool End: ${name}`);
      postMessage({
        type: 'tool_end',
        name: name || '',
        output: data.output
      });
    }
  }
}
