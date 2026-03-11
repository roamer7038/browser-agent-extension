import { create } from 'zustand';
import type { IntegrationConfig } from '@/lib/types/integrations';
import { IntegrationRepository } from '../services/storage/repositories/integration-repository';
import { integrationRegistry } from '../services/integrations/registry';
// Ensure registry is populated
import '../services/integrations/ollama/index';

interface IntegrationState {
  configs: IntegrationConfig[];
  isLoading: boolean;
  error: string | null;

  loadConfigs: () => Promise<void>;
  updateConfig: (config: IntegrationConfig) => Promise<void>;
  testConnection: (config: IntegrationConfig) => Promise<{ success: boolean; error?: string; toolCount?: number }>;
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  configs: [],
  isLoading: true,
  error: null,

  loadConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedConfigs = await IntegrationRepository.getAll();

      // Ensure all registered integrations have a default config if not stored yet
      const registered = integrationRegistry.getAll();
      const updatedConfigs = [...storedConfigs];
      let needsSave = false;

      for (const reg of registered) {
        if (!updatedConfigs.find((c) => c.id === reg.id)) {
          updatedConfigs.push({
            id: reg.id,
            name: reg.name,
            enabled: false,
            apiKey: '',
            settings: {}
          });
          needsSave = true;
        }
      }

      set({ configs: updatedConfigs, isLoading: false });

      if (needsSave) {
        await IntegrationRepository.saveAll(updatedConfigs);
      }
    } catch (err: any) {
      console.error('Failed to load integration configs', err);
      set({ error: err.message, isLoading: false });
    }
  },

  updateConfig: async (config: IntegrationConfig) => {
    try {
      await IntegrationRepository.save(config);
      set((state) => ({
        configs: state.configs.map((c) => (c.id === config.id ? config : c))
      }));
    } catch (err: any) {
      console.error('Failed to save integration config', err);
      throw err;
    }
  },

  testConnection: async (config: IntegrationConfig) => {
    const integration = integrationRegistry.get(config.id);
    if (!integration) {
      return { success: false, error: 'Integration not registered' };
    }
    return await integration.testConnection(config);
  }
}));
