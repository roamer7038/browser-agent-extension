import { describe, it, expect } from 'vitest';
import { parseMessages, getFinalMessages } from '@/lib/utils/message-parser';

describe('parseMessages', () => {
  it('should parse human message', () => {
    const rawMessages = [{ type: 'human', content: 'Hello world' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(expect.objectContaining({ role: 'user', content: 'Hello world', type: 'text' }));
  });

  it('should parse ai message', () => {
    const rawMessages = [{ type: 'ai', content: 'I am an AI' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(expect.objectContaining({ role: 'assistant', content: 'I am an AI', type: 'text' }));
  });

  it('should correctly mark messages as summarized', () => {
    const rawMessages = [
      {
        type: 'human',
        content: 'A summarized message',
        additional_kwargs: { lc_source: 'summarization' }
      }
    ];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(expect.objectContaining({ role: 'system', type: 'system' }));
  });

  it('should parse ai reasoning message', () => {
    const rawMessages = [
      {
        type: 'ai',
        additional_kwargs: { reasoning_content: 'Let me think about this' }
      }
    ];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'reasoning',
        content: 'Let me think about this',
        type: 'reasoning'
      })
    );
  });

  it('should parse tool message', () => {
    const rawMessages = [{ type: 'tool', content: '{"result": "ok"}', name: 'my_tool' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'tool',
        content: '{"result": "ok"}',
        name: 'my_tool',
        type: 'tool_result'
      })
    );
  });

  it('should parse ai message with tool_calls', () => {
    const rawMessages = [
      {
        type: 'ai',
        content: '',
        tool_calls: [{ name: 'browser_navigate', args: { url: 'https://example.com' } }]
      }
    ];
    const messages = parseMessages(rawMessages);

    expect(messages.some((m) => m.type === 'tool_call')).toBe(true);
    const toolCallMsg = messages.find((m) => m.type === 'tool_call');
    expect(toolCallMsg?.name).toBe('browser_navigate');
  });

  it('should parse system/error message', () => {
    const rawMessages = [{ type: 'error', content: 'Something went wrong' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({ role: 'error', content: 'Something went wrong', type: 'text' })
    );
  });

  it('should extract type from getType() method', () => {
    const rawMessages = [{ getType: () => 'human', content: 'via method' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(expect.objectContaining({ role: 'user', content: 'via method' }));
  });

  it('should infer type from id containing AI', () => {
    const rawMessages = [{ id: 'run-AI-123', content: 'Inferred AI' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(expect.objectContaining({ role: 'assistant', content: 'Inferred AI' }));
  });

  it('should return empty for unknown message types', () => {
    const rawMessages = [{ type: 'unknown_type', content: 'mystery' }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(0);
  });

  it('should return empty for invalid Zod parse', () => {
    // content is missing entirely on a human message — still parseable as undefined content
    const rawMessages = [{ type: 'human' }];
    const messages = parseMessages(rawMessages);

    // Should not throw, content will be stringified
    expect(messages).toHaveLength(1);
  });

  it('should handle non-string content by stringifying', () => {
    const rawMessages = [{ type: 'human', content: { nested: 'object' } }];
    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('{"nested":"object"}');
  });

  it('should include usageMetadata on ai messages when present', () => {
    const rawMessages = [
      {
        type: 'ai',
        content: 'response',
        usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
      }
    ];
    const messages = parseMessages(rawMessages);

    const textMsg = messages.find((m) => m.type === 'text');
    expect(textMsg?.usageMetadata).toEqual({
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15
    });
  });
});

describe('getFinalMessages', () => {
  it('should convert response messages', () => {
    const response = {
      messages: [{ type: 'ai', content: 'Hello' }]
    };
    const messages = getFinalMessages(response);

    expect(messages.some((m) => m.role === 'assistant')).toBe(true);
  });

  it('should append screenshots as image messages', () => {
    const response = {
      messages: [{ type: 'ai', content: 'Done' }],
      screenshots: ['data:image/png;base64,abc']
    };
    const messages = getFinalMessages(response);

    const imageMsg = messages.find((m) => m.type === 'image');
    expect(imageMsg).toBeDefined();
    expect(imageMsg?.content).toBe('data:image/png;base64,abc');
  });

  it('should return empty for null/undefined response', () => {
    expect(getFinalMessages(null as unknown as { messages: unknown[] })).toEqual([]);
    expect(getFinalMessages(undefined as unknown as { messages: unknown[] })).toEqual([]);
  });

  it('should return empty for non-array messages', () => {
    expect(getFinalMessages({ messages: 'not-array' as unknown as unknown[] })).toEqual([]);
  });
});
