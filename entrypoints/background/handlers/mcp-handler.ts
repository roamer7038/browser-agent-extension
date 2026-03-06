// entrypoints/background/handlers/mcp-handler.ts
import { testMcpConnection, buildMcpConnectionEntry } from '@/lib/agent/tools/mcp';
import { McpServerRepository } from '@/lib/services/storage/repositories/mcp-server-repository';
import type { McpServerConfig, TestResult, McpToolInfo } from '@/lib/types/agent';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';

export async function handleTestMcpConnection(server: McpServerConfig): Promise<TestResult> {
  try {
    const result = await testMcpConnection(server);
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch the list of tools exposed by a specific MCP server.
 * Connects temporarily, discovers tools, then disconnects.
 */
export async function handleFetchMcpTools(serverId: string): Promise<{ tools: McpToolInfo[] }> {
  const servers = await McpServerRepository.getAll();
  const server = servers.find((s) => s.id === serverId);
  if (!server) {
    throw new Error(`MCP server not found: ${serverId}`);
  }

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
    const toolInfos: McpToolInfo[] = tools.map((t) => ({
      name: t.name,
      description: t.description || '',
      serverName: server.name
    }));
    await client.close();
    return { tools: toolInfos };
  } catch (error: unknown) {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
    throw error;
  }
}
