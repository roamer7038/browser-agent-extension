import { BaseStorage, StorageError } from '../core/base-storage';
import { STORAGE_KEYS } from '../storage-keys';
import { AgentSettingsConfigSchema, type AgentSettingsConfig } from '@/lib/types/agent';
import type { IAgentConfigRepository } from '../interfaces';
import { BaseGenericRepository } from '../core/generic-repository';

const baseRepo = new BaseGenericRepository<AgentSettingsConfig>(
  STORAGE_KEYS.AGENT_CONFIGS,
  AgentSettingsConfigSchema,
  'Agent Config',
  'agentId'
);

export const AgentConfigRepository: IAgentConfigRepository = {
  getAll: () => baseRepo.getAll(),
  getById: (agentId: string) => baseRepo.getById(agentId),
  save: (config: AgentSettingsConfig) => baseRepo.save(config),
  delete: (agentId: string) => baseRepo.delete(agentId),

  getActiveId: async (): Promise<string | null> => {
    try {
      return await BaseStorage.get<string>(STORAGE_KEYS.ACTIVE_AGENT_ID);
    } catch (error) {
      throw new StorageError('Failed to get active agent ID', error);
    }
  },

  setActiveId: async (agentId: string): Promise<void> => {
    try {
      await BaseStorage.set(STORAGE_KEYS.ACTIVE_AGENT_ID, agentId);
    } catch (error) {
      throw new StorageError('Failed to set active agent ID', error);
    }
  },

  getActiveConfig: async (): Promise<AgentSettingsConfig | null> => {
    try {
      const activeId = await AgentConfigRepository.getActiveId();
      const configs = await baseRepo.getAll();
      if (activeId) {
        const found = configs.find((c) => c.agentId === activeId);
        if (found) return found;
      }
      return configs.find((c) => c.agentId === 'default') || configs[0] || null;
    } catch (error) {
      throw new StorageError('Failed to get active Agent Config', error);
    }
  }
};
