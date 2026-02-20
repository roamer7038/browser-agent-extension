import { createAgent } from 'langchain';
import { ChromeStorageCheckpointer } from './checkpointer';
import { createBrowserTools } from './tools/browser';
import { LLMFactory } from './llm';
import { getAllToolNames, TOOL_SETTINGS_STORAGE_KEY } from './tools/tool-meta';

export interface AgentConfig {
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

export async function createLangGraphAgent(config: AgentConfig) {
  // 1. Initialize LLM
  const model = LLMFactory.createModel({
    provider: 'openai',
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    modelName: config.modelName || 'gpt-5'
  });

  // 2. Initialize Tools — filter by user preferences
  const allTools = createBrowserTools();

  const stored = await chrome.storage.local.get([TOOL_SETTINGS_STORAGE_KEY]);
  const enabledNames: string[] = Array.isArray(stored[TOOL_SETTINGS_STORAGE_KEY])
    ? stored[TOOL_SETTINGS_STORAGE_KEY]
    : getAllToolNames();

  const tools = allTools.filter((t) => enabledNames.includes(t.name));

  // 3. Initialize Checkpointer
  const checkpointer = new ChromeStorageCheckpointer();

  // 4. Create Agent
  return createAgent({
    model,
    tools,
    checkpointer
  });
}
