import { useState, useEffect, useCallback } from 'react';
import { AgentConfigRepository } from '@/lib/services/storage/repositories/agent-config-repository';
import { getAllToolNames } from '@/lib/agent/tools/tool-meta';
import type { AgentSettingsConfig } from '@/lib/types/agent';
import { DEFAULT_AGENT_ID } from '@/lib/types/agent';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/agent/default-system-prompt';

/**
 * Generic toggle helper for array-based config fields.
 * Extracts the common Set→add/delete→Array→save pattern.
 */
function toggleArrayField<K extends keyof AgentSettingsConfig>(
  config: AgentSettingsConfig,
  fieldName: K,
  value: string,
  enabled: boolean
): AgentSettingsConfig {
  const currentArray = (config[fieldName] as string[]) || [];
  const set = new Set(currentArray);
  if (enabled) {
    set.add(value);
  } else {
    set.delete(value);
  }
  return { ...config, [fieldName]: Array.from(set) };
}

/**
 * Persists config to storage, logging errors without throwing.
 */
async function persistConfig(config: AgentSettingsConfig): Promise<void> {
  try {
    await AgentConfigRepository.save(config);
  } catch (err) {
    console.error('[useAgentSettings] Failed to save config:', err);
  }
}

/**
 * Hook for managing agent settings.
 * Accepts an optional `agentId` to manage a specific agent's config.
 * Defaults to the active agent (or 'default').
 */
export function useAgentSettings(agentId?: string) {
  const resolvedAgentId = agentId || DEFAULT_AGENT_ID;

  const [config, setConfig] = useState<AgentSettingsConfig>({
    agentId: resolvedAgentId,
    agentName: 'Default Agent',
    providerId: '',
    modelName: '',
    enabledTools: [],
    enabledMcpServers: [],
    disabledMcpTools: [],
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    enabledMiddlewares: [],
    middlewareSettings: {},
    temperature: 0.7,
    topP: 1.0
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const loadConfig = useCallback(async () => {
    let targetAgentId = agentId;
    if (!targetAgentId) {
      targetAgentId = (await AgentConfigRepository.getActiveId()) || DEFAULT_AGENT_ID;
      await AgentConfigRepository.setActiveId(targetAgentId);
    }
    const savedConfig = await AgentConfigRepository.getById(targetAgentId);
    if (savedConfig) {
      setConfig(savedConfig);
    } else {
      // Setup defaults if first time
      const defaultTools = getAllToolNames();
      const defaultConfig: AgentSettingsConfig = {
        agentId: targetAgentId,
        agentName: targetAgentId === DEFAULT_AGENT_ID ? 'Default Agent' : targetAgentId,
        providerId: '',
        modelName: '',
        enabledTools: defaultTools,
        enabledMcpServers: [],
        disabledMcpTools: [],
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        enabledMiddlewares: [],
        middlewareSettings: {},
        temperature: 0.7,
        topP: 1.0
      };
      setConfig(defaultConfig);
    }
    setIsLoaded(true);
  }, [resolvedAgentId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Updates config fields and persists.
   * Save is done OUTSIDE the setState callback to avoid side effects in React updates.
   */
  const updateConfig = async (updates: Partial<AgentSettingsConfig>): Promise<void> => {
    const nextConfig = { ...config, ...updates };
    setConfig(nextConfig);
    await persistConfig(nextConfig);
  };

  const setProviderAndModel = (providerId: string, modelName: string): void => {
    updateConfig({ providerId, modelName });
  };

  const toggleTool = (toolName: string, enabled: boolean): void => {
    const nextConfig = toggleArrayField(config, 'enabledTools', toolName, enabled);
    setConfig(nextConfig);
    persistConfig(nextConfig);
  };

  const toggleMcpServer = (serverId: string, enabled: boolean): void => {
    const nextConfig = toggleArrayField(config, 'enabledMcpServers', serverId, enabled);
    setConfig(nextConfig);
    persistConfig(nextConfig);
  };

  const toggleMcpTool = (toolName: string, enabled: boolean): void => {
    // disabledMcpTools uses inverted logic: enabled=true means REMOVE from disabled list
    const nextConfig = toggleArrayField(config, 'disabledMcpTools', toolName, !enabled);
    setConfig(nextConfig);
    persistConfig(nextConfig);
  };

  const setSystemPrompt = (prompt: string): void => {
    updateConfig({ systemPrompt: prompt });
  };

  const toggleMiddleware = (middlewareName: string, enabled: boolean): void => {
    const nextConfig = toggleArrayField(config, 'enabledMiddlewares', middlewareName, enabled);
    setConfig(nextConfig);
    persistConfig(nextConfig);
  };

  const updateMiddlewareSettings = (settings: NonNullable<AgentSettingsConfig['middlewareSettings']>): void => {
    const newSettings = { ...config.middlewareSettings, ...settings };
    const nextConfig = { ...config, middlewareSettings: newSettings };
    setConfig(nextConfig);
    persistConfig(nextConfig);
  };

  const setRecursionLimit = (value: number | undefined): void => {
    updateConfig({ recursionLimit: value });
  };

  const setModelParams = (temperature: number, topP: number): void => {
    updateConfig({ temperature, topP });
  };

  return {
    config,
    isLoaded,
    updateConfig,
    setProviderAndModel,
    toggleTool,
    toggleMcpServer,
    toggleMcpTool,
    setSystemPrompt,
    toggleMiddleware,
    updateMiddlewareSettings,
    setRecursionLimit,
    setModelParams
  };
}
