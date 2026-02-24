// lib/services/storage/storage-keys.ts
export const STORAGE_KEYS = {
  // LLM Configuration
  API_KEY: 'apiKey',
  BASE_URL: 'baseUrl',
  MODEL_NAME: 'modelName',

  // Thread Management
  LAST_ACTIVE_THREAD_ID: 'lastActiveThreadId',

  // MCP Configuration
  MCP_SERVERS: 'mcpServers',

  // Tool Configuration
  ENABLED_TOOLS: 'enabledTools',

  // Checkpointer
  CHECKPOINT_PREFIX: 'checkpoint:',

  // Screenshots
  SCREENSHOTS_PREFIX: 'screenshots_',
  LAST_SCREENSHOT_DATA_URL: 'lastScreenshotDataUrl'
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
