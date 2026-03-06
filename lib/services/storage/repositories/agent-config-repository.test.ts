import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { AgentConfigRepository } from '@/lib/services/storage/repositories/agent-config-repository';
import { STORAGE_KEYS } from '@/lib/services/storage/storage-keys';
import type { AgentSettingsConfig } from '@/lib/types/agent';

function createConfig(overrides: Partial<AgentSettingsConfig> = {}): AgentSettingsConfig {
  return {
    agentId: 'default',
    agentName: 'Default Agent',
    providerId: 'openai',
    modelName: 'gpt-4',
    enabledTools: [],
    enabledMcpServers: [],
    disabledMcpTools: [],
    enabledMiddlewares: [],
    ...overrides
  };
}

describe('AgentConfigRepository', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe('CRUD via BaseGenericRepository', () => {
    it('should save and retrieve a config', async () => {
      const config = createConfig();
      await AgentConfigRepository.save(config);

      const result = await AgentConfigRepository.getById('default');
      expect(result).toEqual(config);
    });

    it('should return all configs', async () => {
      await AgentConfigRepository.save(createConfig({ agentId: 'a1', agentName: 'Agent 1' }));
      await AgentConfigRepository.save(createConfig({ agentId: 'a2', agentName: 'Agent 2' }));

      const all = await AgentConfigRepository.getAll();
      expect(all).toHaveLength(2);
    });

    it('should delete a config', async () => {
      await AgentConfigRepository.save(createConfig());
      await AgentConfigRepository.delete('default');

      const result = await AgentConfigRepository.getById('default');
      expect(result).toBeNull();
    });
  });

  describe('getActiveId / setActiveId', () => {
    it('should return null when no active ID is set', async () => {
      const id = await AgentConfigRepository.getActiveId();
      expect(id).toBeNull();
    });

    it('should set and get active ID', async () => {
      await AgentConfigRepository.setActiveId('my-agent');

      const id = await AgentConfigRepository.getActiveId();
      expect(id).toBe('my-agent');
    });
  });

  describe('getActiveConfig', () => {
    it('should return config matching active ID', async () => {
      const config = createConfig({ agentId: 'active-one', agentName: 'Active' });
      await AgentConfigRepository.save(config);
      await AgentConfigRepository.setActiveId('active-one');

      const result = await AgentConfigRepository.getActiveConfig();
      expect(result?.agentId).toBe('active-one');
    });

    it('should fallback to default agent when active ID config not found', async () => {
      const defaultConfig = createConfig({ agentId: 'default', agentName: 'Default' });
      await AgentConfigRepository.save(defaultConfig);
      await AgentConfigRepository.setActiveId('nonexistent');

      const result = await AgentConfigRepository.getActiveConfig();
      expect(result?.agentId).toBe('default');
    });

    it('should fallback to first config when no default and no matching active', async () => {
      const config = createConfig({ agentId: 'custom-1', agentName: 'Custom' });
      await AgentConfigRepository.save(config);
      await AgentConfigRepository.setActiveId('nonexistent');

      const result = await AgentConfigRepository.getActiveConfig();
      expect(result?.agentId).toBe('custom-1');
    });

    it('should return null when no configs exist', async () => {
      const result = await AgentConfigRepository.getActiveConfig();
      expect(result).toBeNull();
    });
  });
});
