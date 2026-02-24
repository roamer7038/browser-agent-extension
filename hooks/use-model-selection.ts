// hooks/use-model-selection.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { StorageService } from '@/lib/services/storage/storage-service';
import { MessageBus } from '@/lib/services/message/message-bus';
import { getCachedModels, saveCacheWithMeta } from '@/lib/agent/model-cache';

export function useModelSelection() {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const fetchModels = useCallback(async (forceRefresh = false) => {
    setModelsLoading(true);
    try {
      const config = await StorageService.getLLMConfig();

      if (!config.apiKey) {
        toast.error('API Keyが設定されていません。先にAPI Keyを保存してください。');
        setAvailableModels([]);
        return;
      }

      // キャッシュチェック
      if (!forceRefresh) {
        const cached = await getCachedModels(config.apiKey, config.baseUrl || '');
        if (cached) {
          setAvailableModels(cached);
          setModelsLoading(false);
          return;
        }
      }

      // APIから取得
      const models = await MessageBus.fetchModels();

      // キャッシュに保存
      await saveCacheWithMeta(models, config.apiKey, config.baseUrl || '');
      setAvailableModels(models);
    } catch (error: any) {
      toast.error(`モデルリストの取得に失敗しました: ${error.message}`);
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  const handleRefreshModels = useCallback(async () => {
    await MessageBus.clearModelCache();
    await fetchModels(true);
  }, [fetchModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    availableModels,
    modelsLoading,
    fetchModels,
    handleRefreshModels
  };
}
