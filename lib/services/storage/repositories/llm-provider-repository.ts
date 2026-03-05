import { STORAGE_KEYS } from '../storage-keys';
import { LlmProviderConfigSchema, type LlmProviderConfig } from '@/lib/types/agent';
import { SecureGenericRepository } from '../core/secure-generic-repository';

const secureBaseRepo = new SecureGenericRepository<LlmProviderConfig>(
  STORAGE_KEYS.LLM_PROVIDERS,
  LlmProviderConfigSchema,
  'LLM Provider',
  'id',
  ['apiKey']
);

export class LlmProviderRepository {
  static getAll(): Promise<LlmProviderConfig[]> {
    return secureBaseRepo.getAll();
  }

  static saveAll(providers: LlmProviderConfig[]): Promise<void> {
    return secureBaseRepo.saveAll(providers);
  }
}
