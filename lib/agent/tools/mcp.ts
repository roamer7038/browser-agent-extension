import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { DynamicStructuredTool } from '@langchain/core/tools';

import type { McpServerConfig } from './mcp-types';

/** MCP connection entry for MultiServerMCPClient */
interface McpConnectionEntry {
  transport?: 'http' | 'sse';
  url: string;
  headers?: Record<string, string>;
}

/**
 * Build a single MCP connection entry from a server config.
 * Shared utility used by createMcpTools, testMcpConnection, and handleFetchMcpTools.
 */
export function buildMcpConnectionEntry(server: McpServerConfig): McpConnectionEntry {
  const entry: McpConnectionEntry = { url: server.url };

  if (server.transport === 'sse') {
    entry.transport = 'sse';
  }

  if (Object.keys(server.headers).length > 0) {
    entry.headers = server.headers;
  }

  return entry;
}

/**
 * Build MCP server connection config for MultiServerMCPClient from user settings.
 */
function buildMcpServerEntries(
  servers: McpServerConfig[],
  enabledServerIds: string[]
): Record<string, McpConnectionEntry> {
  const entries: Record<string, McpConnectionEntry> = {};

  for (const server of servers) {
    if (!enabledServerIds.includes(server.id)) continue;
    entries[server.name] = buildMcpConnectionEntry(server);
  }

  return entries;
}

/**
 * Create LangChain tools from enabled remote MCP servers.
 * Returns an empty array if no servers are enabled or all connections fail.
 */
export async function createMcpTools(
  servers: McpServerConfig[],
  enabledServerIds: string[]
): Promise<{ tools: DynamicStructuredTool[]; client: MultiServerMCPClient | null }> {
  const enabledServers = servers.filter((s) => enabledServerIds.includes(s.id));
  if (enabledServers.length === 0) {
    return { tools: [], client: null };
  }

  const mcpServers = buildMcpServerEntries(servers, enabledServerIds);

  const client = new MultiServerMCPClient({
    throwOnLoadError: false,
    onConnectionError: 'ignore',
    mcpServers
  });

  try {
    const tools = await client.getTools();
    return { tools, client };
  } catch (error) {
    console.error('Failed to initialize MCP tools:', error);
    return { tools: [], client: null };
  }
}

/**
 * Test connectivity to a single MCP server.
 * Returns `{ success: true, toolCount }` or `{ success: false, error }`.
 */
export async function testMcpConnection(
  server: McpServerConfig
): Promise<{ success: boolean; toolCount?: number; error?: string }> {
  const entry = buildMcpConnectionEntry(server);

  const client = new MultiServerMCPClient({
    throwOnLoadError: true,
    onConnectionError: 'throw',
    mcpServers: {
      [server.name]: entry
    }
  });

  try {
    const tools = await client.getTools();
    await client.close();
    return { success: true, toolCount: tools.length };
  } catch (error: unknown) {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
