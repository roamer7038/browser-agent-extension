import { BaseStorage, StorageError } from '../core/base-storage';
import { STORAGE_KEYS } from '../storage-keys';
import { LlmProviderConfigSchema, type LlmProviderConfig } from '@/lib/types/agent';
import { CryptoService } from '../../crypto/crypto-service';
import { z } from 'zod';

export class LlmProviderRepository {
  static async getAll(): Promise<LlmProviderConfig[]> {
    try {
      const data = await BaseStorage.get<unknown>(STORAGE_KEYS.LLM_PROVIDERS);
      if (!data) return [];

      const parsed = z.array(LlmProviderConfigSchema).safeParse(data);
      if (!parsed.success) {
        console.warn('Invalid LLM Providers found in storage', parsed.error);
        return [];
      }

      return Promise.all(
        parsed.data.map(async (provider) => {
          if (provider.apiKey) {
            const decryptedKey = await CryptoService.decrypt(provider.apiKey);
            return { ...provider, apiKey: decryptedKey };
          }
          return provider;
        })
      );
    } catch (error) {
      throw new StorageError('Failed to get LLM providers', error);
    }
  }

  static async saveAll(providers: LlmProviderConfig[]): Promise<void> {
    try {
      const encryptedProviders = await Promise.all(
        providers.map(async (provider) => {
          if (provider.apiKey) {
            const encryptedKey = await CryptoService.encrypt(provider.apiKey);
            return { ...provider, apiKey: encryptedKey };
          }
          return provider;
        })
      );
      await BaseStorage.set(STORAGE_KEYS.LLM_PROVIDERS, encryptedProviders);
    } catch (error) {
      throw new StorageError('Failed to save LLM providers', error);
    }
  }
}
