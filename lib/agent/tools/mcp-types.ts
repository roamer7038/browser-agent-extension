// lib/agent/tools/mcp-types.ts
// Re-export McpServerConfig from the canonical location
export type { McpServerConfig } from '../../types/agent';

import { STORAGE_KEYS } from '../../services/storage/storage-keys';

/** Storage key for MCP server configurations — re-exported from canonical STORAGE_KEYS */
export const MCP_SERVERS_STORAGE_KEY = STORAGE_KEYS.MCP_SERVERS;
