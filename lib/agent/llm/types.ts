/** Supported LLM provider types */
export type LlmProviderType = 'openai' | 'openai-compatible' | 'ollama' | 'anthropic' | 'google';

export interface LLMConfig {
  provider: LlmProviderType;
  apiKey: string;
  modelName?: string;
  baseUrl?: string;
  temperature?: number;
  topP?: number;
}
