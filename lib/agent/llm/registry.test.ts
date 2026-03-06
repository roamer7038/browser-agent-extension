import { describe, it, expect, vi } from 'vitest';
import { LLMRegistry } from '@/lib/agent/llm/registry';
import { UnsupportedProviderError } from '@/lib/agent/llm/errors';
import type { ILLMProvider } from '@/lib/agent/llm/provider-interface';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { LLMConfig } from '@/lib/agent/llm/types';

function createMockProvider(name: string): ILLMProvider {
  return {
    name,
    createModel: vi.fn().mockReturnValue({ name: `${name}-model` } as unknown as BaseChatModel)
  };
}

describe('LLMRegistry', () => {
  describe('register and get', () => {
    it('should register and retrieve a provider', () => {
      const registry = new LLMRegistry();
      const provider = createMockProvider('openai');
      registry.register(provider);

      expect(registry.get('openai')).toBe(provider);
    });

    it('should return undefined for unregistered provider', () => {
      const registry = new LLMRegistry();
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite an existing provider with the same name', () => {
      const registry = new LLMRegistry();
      const provider1 = createMockProvider('openai');
      const provider2 = createMockProvider('openai');
      registry.register(provider1);
      registry.register(provider2);

      expect(registry.get('openai')).toBe(provider2);
    });
  });

  describe('createModel', () => {
    it('should create a model using the registered provider', () => {
      const registry = new LLMRegistry();
      const provider = createMockProvider('openai');
      registry.register(provider);

      const config: LLMConfig = { provider: 'openai', apiKey: 'test-key', modelName: 'gpt-4' };
      registry.createModel(config);

      expect(provider.createModel).toHaveBeenCalledWith(config);
    });

    it('should map openai-compatible to openai provider', () => {
      const registry = new LLMRegistry();
      const provider = createMockProvider('openai');
      registry.register(provider);

      const config: LLMConfig = {
        provider: 'openai-compatible',
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com'
      };
      registry.createModel(config);

      expect(provider.createModel).toHaveBeenCalledWith(config);
    });

    it('should throw UnsupportedProviderError for unknown provider', () => {
      const registry = new LLMRegistry();

      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key'
      };

      expect(() => registry.createModel(config)).toThrow(UnsupportedProviderError);
    });
  });
});
