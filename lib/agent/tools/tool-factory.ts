import { createBrowserTools } from './browser/index';
import { createMcpTools } from './mcp';
import { getAllToolNames, getAllIntegrationToolNames } from './tool-meta';
import { McpServerRepository } from '../../services/storage/repositories/mcp-server-repository';
import type { AgentSettingsConfig } from '../../types/agent';
import type { DynamicStructuredTool } from '@langchain/core/tools';

import { integrationRegistry } from '../../services/integrations/registry';
// Ensure Ollama integration is registered
import '../../services/integrations/ollama/index';

export class ToolFactory {
  private static activeMcpClient: { close(): Promise<void> } | null = null;

  static async createTools(agentSettings: AgentSettingsConfig | null): Promise<{
    browserTools: DynamicStructuredTool[];
    mcpTools: DynamicStructuredTool[];
    integrationTools: DynamicStructuredTool[];
    allTools: DynamicStructuredTool[];
  }> {
    if (this.activeMcpClient) {
      try {
        await this.activeMcpClient.close();
      } catch {
        // ignore
      }
      this.activeMcpClient = null;
    }

    const allBrowserTools = createBrowserTools();
    const enabledBrowserTools = agentSettings?.enabledTools || getAllToolNames();
    const browserTools = allBrowserTools.filter((t) => enabledBrowserTools.includes(t.name));

    console.log(`[Agent Setup] Filtered Browser Tools: ${browserTools.length} enabled`);

    const enabledMcpServers = agentSettings?.enabledMcpServers || [];
    const disabledMcpTools = agentSettings?.disabledMcpTools || [];

    let filteredMcpTools: DynamicStructuredTool[] = [];
    try {
      const mcpServers = await McpServerRepository.getAll();
      const { tools: mcpTools, client: mcpClient } = await createMcpTools(mcpServers, enabledMcpServers);
      this.activeMcpClient = mcpClient;

      if (mcpTools.length > 0) {
        console.log(`[Agent Setup] Loaded ${mcpTools.length} MCP tool(s) from remote server(s).`);
      }

      filteredMcpTools = mcpTools.filter((t) => !disabledMcpTools.includes(t.name));
      console.log(`[Agent Setup] Active MCP Tools: ${filteredMcpTools.length} enabled`);
    } catch (err) {
      console.error('[Agent Setup] Failed to load MCP tools', err);
    }

    let integrationTools: DynamicStructuredTool[] = [];
    try {
      // Integration tools must be cast to DynamicStructuredTool here because they are created with it
      const allIntegrationTools = (await integrationRegistry.getEnabledTools()) as DynamicStructuredTool[];
      const defaultEnabled = agentSettings?.enabledTools || [...getAllToolNames(), ...getAllIntegrationToolNames()];

      integrationTools = allIntegrationTools.filter((t) => defaultEnabled.includes(t.name));

      if (integrationTools.length > 0) {
        console.log(`[Agent Setup] Loaded ${integrationTools.length} integration tool(s).`);
      }
    } catch (err) {
      console.error('[Agent Setup] Failed to load integration tools', err);
    }

    return {
      browserTools,
      mcpTools: filteredMcpTools,
      integrationTools,
      allTools: [...browserTools, ...filteredMcpTools, ...integrationTools]
    };
  }
}
