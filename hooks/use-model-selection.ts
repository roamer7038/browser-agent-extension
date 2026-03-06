// hooks/use-model-selection.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AgentConfigRepository } from '@/lib/services/storage/repositories/agent-config-repository';
import { LlmProviderRepository } from '@/lib/services/storage/repositories/llm-provider-repository';
import { sendMessage } from '@/lib/messaging';
import { getCachedModels, saveCacheWithMeta } from '@/lib/agent/model-cache';

export function useModelSelection(providerId?: string) {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const fetchModels = useCallback(
    async (forceRefresh = false) => {
      setModelsLoading(true);
      try {
        const agentConfig = await AgentConfigRepository.getActiveConfig();
        const providers = await LlmProviderRepository.getAll();

        // We now need to look at the providerId passed, normally we take it from param, or from Agent Settings
        // If we are configuring the agent settings, we pass the providerId.
        const targetProviderId = providerId || agentConfig?.providerId;

        if (!targetProviderId) {
          // Only show toast if forcefully asked, otherwise fail silently for clean UI
          if (forceRefresh) toast.error('エージェント設定でLLMプロバイダが選択されていません。');
          setAvailableModels([]);
          return;
        }

        const activeProvider = providers.find((p) => p.id === targetProviderId);
        if (!activeProvider?.apiKey) {
          toast.error('選択されたLLMプロバイダのAPI Keyが設定されていません。');
          setAvailableModels([]);
          return;
        }

        // キャッシュチェック
        if (!forceRefresh) {
          const cached = await getCachedModels(activeProvider.apiKey, activeProvider.baseUrl || '');
          if (cached) {
            setAvailableModels(cached);
            setModelsLoading(false);
            return;
          }
        }

        // APIから取得 (background script now handles the provider fetching natively from storage,
        // but since we updated it to receive the provider by parameter, we need to pass it or change messagebus API.
        // Wait, we updated background.js to fetch the Provider by getting AgentConfig directly.
        const response = await sendMessage('fetch_models', undefined);
        if ('error' in response && response.error) {
          throw new Error(response.error);
        }
        const models = ('models' in response && response.models) || [];

        // キャッシュに保存
        await saveCacheWithMeta(models, activeProvider.apiKey, activeProvider.baseUrl || '');
        setAvailableModels(models);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`モデルリストの取得に失敗しました: ${errorMessage}`);
        setAvailableModels([]);
      } finally {
        setModelsLoading(false);
      }
    },
    [providerId]
  );

  useEffect(() => {
    fetchModels(false);
  }, [fetchModels]);

  const handleRefreshModels = useCallback(async () => {
    await sendMessage('clear_model_cache', undefined);
    await fetchModels(true);
  }, [fetchModels]);

  return {
    availableModels,
    modelsLoading,
    fetchModels,
    handleRefreshModels
  };
}
