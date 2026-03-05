import { describe, it, expect } from 'vitest';
import { parseMessages } from '@/lib/utils/message-parser';

describe('Message Parser', () => {
  it('should parse human message', () => {
    const rawMessages = [
      {
        type: 'human',
        content: 'Hello world'
      }
    ];

    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'user',
        content: 'Hello world',
        type: 'text'
      })
    );
  });

  it('should parse ai message', () => {
    const rawMessages = [
      {
        type: 'ai',
        content: 'I am an AI'
      }
    ];

    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'assistant',
        content: 'I am an AI',
        type: 'text'
      })
    );
  });

  it('should correctly mark messages as summarized', () => {
    const rawMessages = [
      {
        type: 'human',
        content: 'A summarized message',
        additional_kwargs: {
          lc_source: 'summarization'
        }
      }
    ];

    const messages = parseMessages(rawMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        type: 'system'
      })
    );
  });

  it('should parse ai reasoning message', () => {
    const rawMessages = [
      {
        type: 'ai',
        additional_kwargs: {
          reasoning_content: 'Let me think about this'
        }
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
});
