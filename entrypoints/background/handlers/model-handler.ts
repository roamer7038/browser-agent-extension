// entrypoints/background/handlers/model-handler.ts
/// <reference types="chrome"/>
import { clearModelCache } from '@/lib/agent/model-cache';
import type { FetchModelsResponse } from '@/lib/services/message/message-types';
import type { LlmProviderConfig } from '@/lib/types/agent';

/** Ollama model response shape */
interface OllamaModel {
  name: string;
}

/** OpenAI-compatible model response shape */
interface OpenAIModel {
  id: string;
}

export async function handleFetchModels(provider: LlmProviderConfig): Promise<FetchModelsResponse> {
  if (!provider.apiKey && provider.providerType !== 'ollama') {
    throw new Error('API Key is not configured for this provider');
  }

  let baseUrl =
    provider.baseUrl || (provider.providerType === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1');
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  if (provider.providerType === 'ollama') {
    const url = `${baseUrl}/api/tags`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) {
      throw new Error('Invalid response format from Ollama API');
    }
    const models = data.models
      .map((m: OllamaModel) => m.name)
      .filter((name: string) => typeof name === 'string')
      .sort();
    return { models };
  }
  const url = `${baseUrl}/models`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid response format from API');
  }

  // Extract model IDs and sort alphabetically
  const models = data.data
    .map((m: OpenAIModel) => m.id)
    .filter((id: string) => typeof id === 'string')
    .sort();

  return { models };
}

export async function handleClearModelCache(): Promise<{ success: true }> {
  await clearModelCache();
  return { success: true };
}
