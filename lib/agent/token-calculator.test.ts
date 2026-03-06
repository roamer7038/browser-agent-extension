import { describe, it, expect } from 'vitest';
import { getLatestTokenUsage } from '@/lib/agent/token-calculator';
import type { MappedMessage } from '@/lib/agent/message-mapper';

function createMessage(overrides: Partial<MappedMessage> = {}): MappedMessage {
  return {
    type: 'ai',
    content: '',
    tool_calls: [],
    additional_kwargs: {},
    ...overrides
  };
}

describe('getLatestTokenUsage', () => {
  it('should extract token usage from the last ai message', () => {
    const messages: MappedMessage[] = [
      createMessage({
        type: 'human',
        usage_metadata: { input_tokens: 999, output_tokens: 999, total_tokens: 999 }
      }),
      createMessage({
        type: 'ai',
        usage_metadata: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
      })
    ];

    const usage = getLatestTokenUsage(messages);
    expect(usage).toEqual({ inputTokens: 100, outputTokens: 50, totalTokens: 150 });
  });

  it('should return zeros for empty array', () => {
    const usage = getLatestTokenUsage([]);
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });

  it('should return zeros when no ai messages exist', () => {
    const messages: MappedMessage[] = [createMessage({ type: 'human' }), createMessage({ type: 'tool' })];

    const usage = getLatestTokenUsage(messages);
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });

  it('should return zeros when ai message has no usage_metadata', () => {
    const messages: MappedMessage[] = [createMessage({ type: 'ai' })];

    const usage = getLatestTokenUsage(messages);
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });

  it('should use the last ai message, not earlier ones', () => {
    const messages: MappedMessage[] = [
      createMessage({
        type: 'ai',
        usage_metadata: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
      }),
      createMessage({ type: 'human' }),
      createMessage({
        type: 'ai',
        usage_metadata: { input_tokens: 200, output_tokens: 100, total_tokens: 300 }
      })
    ];

    const usage = getLatestTokenUsage(messages);
    expect(usage).toEqual({ inputTokens: 200, outputTokens: 100, totalTokens: 300 });
  });
});
