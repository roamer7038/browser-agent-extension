import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getCachedModels, saveCacheWithMeta, clearModelCache } from '@/lib/agent/model-cache/index';

describe('Model Cache', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.restoreAllMocks();
  });

  describe('saveCacheWithMeta + getCachedModels', () => {
    it('should save and retrieve cached models', async () => {
      const models = ['gpt-4', 'gpt-3.5-turbo'];
      await saveCacheWithMeta(models, 'test-api-key', 'https://api.openai.com');

      const result = await getCachedModels('test-api-key', 'https://api.openai.com');
      expect(result).toEqual(models);
    });

    it('should return null when no cache exists', async () => {
      const result = await getCachedModels('key', 'https://api.openai.com');
      expect(result).toBeNull();
    });

    it('should return null when API key differs', async () => {
      const models = ['gpt-4'];
      await saveCacheWithMeta(models, 'key-1', 'https://api.openai.com');

      const result = await getCachedModels('key-2', 'https://api.openai.com');
      expect(result).toBeNull();
    });

    it('should return null when base URL differs', async () => {
      const models = ['gpt-4'];
      await saveCacheWithMeta(models, 'key', 'https://api.openai.com');

      const result = await getCachedModels('key', 'https://other-api.com');
      expect(result).toBeNull();
    });

    it('should return null when cache is expired', async () => {
      const models = ['gpt-4'];
      await saveCacheWithMeta(models, 'key', 'https://api.openai.com');

      // Mock Date.now to return 25 hours later
      const originalNow = Date.now;
      vi.spyOn(Date, 'now').mockReturnValue(originalNow() + 25 * 60 * 60 * 1000);

      const result = await getCachedModels('key', 'https://api.openai.com');
      expect(result).toBeNull();
    });
  });

  describe('clearModelCache', () => {
    it('should clear cached models', async () => {
      const models = ['gpt-4'];
      await saveCacheWithMeta(models, 'key', 'https://api.openai.com');

      await clearModelCache();

      const result = await getCachedModels('key', 'https://api.openai.com');
      expect(result).toBeNull();
    });
  });
});
