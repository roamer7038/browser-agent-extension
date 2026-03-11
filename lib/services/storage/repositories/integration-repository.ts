import { STORAGE_KEYS } from '../storage-keys';
import { IntegrationConfigSchema, type IntegrationConfig } from '@/lib/types/integrations';
import { SecureGenericRepository } from '../core/secure-generic-repository';

// Use SecureGenericRepository to automatically encrypt/decrypt the apiKey field
const secureBaseRepo = new SecureGenericRepository<IntegrationConfig>(
  STORAGE_KEYS.INTEGRATIONS,
  IntegrationConfigSchema,
  'Integration',
  'id',
  ['apiKey']
);

export class IntegrationRepository {
  static getAll(): Promise<IntegrationConfig[]> {
    return secureBaseRepo.getAll();
  }

  static getById(id: string): Promise<IntegrationConfig | null> {
    return secureBaseRepo.getById(id);
  }

  static save(integration: IntegrationConfig): Promise<void> {
    return secureBaseRepo.save(integration);
  }

  static saveAll(integrations: IntegrationConfig[]): Promise<void> {
    return secureBaseRepo.saveAll(integrations);
  }

  static delete(id: string): Promise<void> {
    return secureBaseRepo.delete(id);
  }
}
