import { describe, it, expect, vi } from 'vitest';
import { processStreamEvents } from '@/lib/agent/stream-processor';

function createMockPort(): chrome.runtime.Port {
  return {
    postMessage: vi.fn(),
    name: 'test-port',
    disconnect: vi.fn(),
    onDisconnect: { addListener: vi.fn(), removeListener: vi.fn(), hasListener: vi.fn() },
    onMessage: { addListener: vi.fn(), removeListener: vi.fn(), hasListener: vi.fn() }
  } as unknown as chrome.runtime.Port;
}

async function* createEventStream(
  events: Array<{ event: string; name?: string; data: Record<string, unknown> }>
): AsyncGenerator<{ event: string; name?: string; data: Record<string, unknown> }> {
  for (const event of events) {
    yield event;
  }
}

describe('processStreamEvents', () => {
  it('should post stream_chunk for on_chat_model_stream event', async () => {
    const port = createMockPort();
    const events = createEventStream([
      {
        event: 'on_chat_model_stream',
        data: {
          chunk: {
            content: 'Hello',
            tool_call_chunks: [],
            additional_kwargs: {}
          }
        }
      }
    ]);

    await processStreamEvents(events, port);

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'stream_chunk',
      chunk: {
        content: 'Hello',
        tool_call_chunks: [],
        additional_kwargs: {}
      }
    });
  });

  it('should post tool_start for on_tool_start event', async () => {
    const port = createMockPort();
    const events = createEventStream([
      {
        event: 'on_tool_start',
        name: 'browser_navigate',
        data: { input: { url: 'https://example.com' } }
      }
    ]);

    await processStreamEvents(events, port);

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'tool_start',
      name: 'browser_navigate',
      input: { url: 'https://example.com' }
    });
  });

  it('should post tool_end for on_tool_end event', async () => {
    const port = createMockPort();
    const events = createEventStream([
      {
        event: 'on_tool_end',
        name: 'browser_navigate',
        data: { output: 'Navigated successfully' }
      }
    ]);

    await processStreamEvents(events, port);

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'tool_end',
      name: 'browser_navigate',
      output: 'Navigated successfully'
    });
  });

  it('should handle on_chain_start and on_chain_end without posting messages', async () => {
    const port = createMockPort();
    const events = createEventStream([
      { event: 'on_chain_start', name: 'agent', data: {} },
      { event: 'on_chain_end', name: 'agent', data: {} }
    ]);

    await processStreamEvents(events, port);

    // on_chain_start/end only log, they don't post messages
    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it('should handle null port gracefully', async () => {
    const events = createEventStream([
      {
        event: 'on_chat_model_stream',
        data: { chunk: { content: 'test', tool_call_chunks: [], additional_kwargs: {} } }
      }
    ]);

    // Should not throw with null port
    await expect(processStreamEvents(events, null)).resolves.toBeUndefined();
  });

  it('should handle multiple events in sequence', async () => {
    const port = createMockPort();
    const events = createEventStream([
      { event: 'on_tool_start', name: 'tool_a', data: { input: 'x' } },
      {
        event: 'on_chat_model_stream',
        data: { chunk: { content: 'Chunk 1' } }
      },
      { event: 'on_tool_end', name: 'tool_a', data: { output: 'done' } }
    ]);

    await processStreamEvents(events, port);

    expect(port.postMessage).toHaveBeenCalledTimes(3);
  });

  it('should default content to empty string when chunk.content is falsy', async () => {
    const port = createMockPort();
    const events = createEventStream([
      {
        event: 'on_chat_model_stream',
        data: { chunk: {} }
      }
    ]);

    await processStreamEvents(events, port);

    expect(port.postMessage).toHaveBeenCalledWith({
      type: 'stream_chunk',
      chunk: {
        content: '',
        tool_call_chunks: [],
        additional_kwargs: {}
      }
    });
  });
});
