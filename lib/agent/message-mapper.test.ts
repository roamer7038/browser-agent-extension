import { describe, it, expect } from 'vitest';
import { mapRawMessages } from '@/lib/agent/message-mapper';

describe('mapRawMessages', () => {
  it('should map a human message with getType() method', () => {
    const raw = [{ getType: () => 'human', content: 'Hello', id: 'msg-1' }];
    const result = mapRawMessages(raw);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('human');
    expect(result[0].content).toBe('Hello');
  });

  it('should map an ai message using type field', () => {
    const raw = [{ type: 'ai', content: 'Response', id: 'msg-2' }];
    const result = mapRawMessages(raw);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('ai');
  });

  it('should fallback to id-based type detection for Human', () => {
    const raw = [{ id: 'run-Human-abc', content: 'Fallback human' }];
    const result = mapRawMessages(raw);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('human');
  });

  it('should fallback to ai when id does not contain Human', () => {
    const raw = [{ id: 'run-xyz', content: 'Fallback ai' }];
    const result = mapRawMessages(raw);

    expect(result[0].type).toBe('ai');
  });

  it('should preserve tool_calls array', () => {
    const toolCalls = [{ name: 'navigate', args: { url: 'https://example.com' } }];
    const raw = [{ type: 'ai', content: '', tool_calls: toolCalls }];
    const result = mapRawMessages(raw);

    expect(result[0].tool_calls).toEqual(toolCalls);
  });

  it('should default tool_calls to empty array when missing', () => {
    const raw = [{ type: 'ai', content: 'No tools' }];
    const result = mapRawMessages(raw);

    expect(result[0].tool_calls).toEqual([]);
  });

  it('should preserve additional_kwargs', () => {
    const raw = [{ type: 'ai', content: '', additional_kwargs: { reasoning_content: 'thinking...' } }];
    const result = mapRawMessages(raw);

    expect(result[0].additional_kwargs).toEqual({ reasoning_content: 'thinking...' });
  });

  it('should default additional_kwargs to empty object when missing', () => {
    const raw = [{ type: 'ai', content: 'No kwargs' }];
    const result = mapRawMessages(raw);

    expect(result[0].additional_kwargs).toEqual({});
  });

  it('should preserve usage_metadata', () => {
    const usage = { input_tokens: 100, output_tokens: 50, total_tokens: 150 };
    const raw = [{ type: 'ai', content: 'With usage', usage_metadata: usage }];
    const result = mapRawMessages(raw);

    expect(result[0].usage_metadata).toEqual(usage);
  });

  it('should map multiple messages', () => {
    const raw = [
      { type: 'human', content: 'Q' },
      { type: 'ai', content: 'A' }
    ];
    const result = mapRawMessages(raw);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('human');
    expect(result[1].type).toBe('ai');
  });

  it('should return empty array for empty input', () => {
    const result = mapRawMessages([]);
    expect(result).toEqual([]);
  });
});
