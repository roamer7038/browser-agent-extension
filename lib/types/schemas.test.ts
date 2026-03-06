import { describe, it, expect } from 'vitest';
import { MessageSchema, ThreadTokenUsageSchema, TokenUsageMetadataSchema } from '@/lib/types/schemas';

describe('TokenUsageMetadataSchema', () => {
  it('should parse valid token usage', () => {
    const result = TokenUsageMetadataSchema.safeParse({
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing fields', () => {
    const result = TokenUsageMetadataSchema.safeParse({ input_tokens: 100 });
    expect(result.success).toBe(false);
  });

  it('should reject non-number values', () => {
    const result = TokenUsageMetadataSchema.safeParse({
      input_tokens: 'not-a-number',
      output_tokens: 50,
      total_tokens: 150
    });
    expect(result.success).toBe(false);
  });
});

describe('ThreadTokenUsageSchema', () => {
  it('should parse valid thread token usage', () => {
    const result = ThreadTokenUsageSchema.safeParse({
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing fields', () => {
    const result = ThreadTokenUsageSchema.safeParse({ inputTokens: 100 });
    expect(result.success).toBe(false);
  });
});

describe('MessageSchema', () => {
  it('should parse valid text message', () => {
    const result = MessageSchema.safeParse({
      role: 'user',
      content: 'Hello',
      type: 'text'
    });
    expect(result.success).toBe(true);
  });

  it('should parse valid tool_call message', () => {
    const result = MessageSchema.safeParse({
      role: 'tool',
      content: '{}',
      type: 'tool_call',
      name: 'browser_navigate'
    });
    expect(result.success).toBe(true);
  });

  it('should parse message without optional fields', () => {
    const result = MessageSchema.safeParse({
      role: 'assistant',
      content: 'Response'
    });
    expect(result.success).toBe(true);
  });

  it('should parse message with usageMetadata', () => {
    const result = MessageSchema.safeParse({
      role: 'assistant',
      content: 'Response',
      type: 'text',
      usageMetadata: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid role', () => {
    const result = MessageSchema.safeParse({
      role: 'invalid_role',
      content: 'test'
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = MessageSchema.safeParse({
      role: 'user',
      content: 'test',
      type: 'invalid_type'
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid roles', () => {
    const roles = ['user', 'assistant', 'error', 'tool', 'reasoning', 'system'];
    for (const role of roles) {
      const result = MessageSchema.safeParse({ role, content: 'test' });
      expect(result.success).toBe(true);
    }
  });

  it('should accept all valid types', () => {
    const types = ['text', 'image', 'tool_call', 'tool_result', 'reasoning', 'system'];
    for (const type of types) {
      const result = MessageSchema.safeParse({ role: 'assistant', content: 'test', type });
      expect(result.success).toBe(true);
    }
  });
});
