import { useEffect } from 'react';
import { Puzzle, Plug } from 'lucide-react';
import type { LlmProviderConfig, AgentSettingsConfig, McpServerConfig } from '@/lib/types/agent';
import { BROWSER_TOOL_META, INTEGRATION_TOOL_META } from '@/lib/agent/tools/tool-meta';
import { useIntegrationStore } from '@/lib/store/integration-store';
import { SystemPromptEditor } from './system-prompt-editor';
import { ModelSelector } from './model-selector';
import { ToolToggleList } from './tool-toggle-list';
import { McpToolIntegration } from './mcp-tool-integration';
import { MiddlewareSettings } from './middleware-settings';
import { MiscSettings } from './misc-settings';

interface AgentSettingsSectionProps {
  agentConfig: AgentSettingsConfig;
  providers: LlmProviderConfig[];
  mcpServers: McpServerConfig[];
  setProviderAndModel: (providerId: string, modelName: string) => void;
  setSystemPrompt: (prompt: string) => void;
  toggleTool: (toolName: string, enabled: boolean) => void;
  toggleMcpServer: (serverId: string, enabled: boolean) => void;
  toggleMcpTool: (toolName: string, enabled: boolean) => void;
  toggleMiddleware: (middlewareName: string, enabled: boolean) => void;
  updateMiddlewareSettings: (settings: NonNullable<AgentSettingsConfig['middlewareSettings']>) => void;
  setModelParams: (temperature: number, topP: number) => void;
  setRecursionLimit: (value: number | undefined) => void;
}

export function AgentSettingsSection({
  agentConfig,
  providers,
  mcpServers,
  setProviderAndModel,
  setSystemPrompt,
  toggleTool,
  toggleMcpServer,
  toggleMcpTool,
  toggleMiddleware,
  updateMiddlewareSettings,
  setModelParams,
  setRecursionLimit
}: AgentSettingsSectionProps) {
  const { configs, loadConfigs } = useIntegrationStore();

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const enabledIntegrationIds = configs.filter((c) => c.enabled).map((c) => c.id);
  const availableIntegrationTools = INTEGRATION_TOOL_META.filter(
    (t) => !t.integrationId || enabledIntegrationIds.includes(t.integrationId)
  );

  return (
    <div className='space-y-8'>
      <SystemPromptEditor systemPrompt={agentConfig.systemPrompt || ''} onSystemPromptChange={setSystemPrompt} />

      <ModelSelector
        modelName={agentConfig.modelName}
        providerId={agentConfig.providerId}
        providers={providers}
        temperature={agentConfig.temperature}
        topP={agentConfig.topP}
        onModelChange={setProviderAndModel}
        onProviderChange={(newProviderId) => setProviderAndModel(newProviderId, '')}
        onParamsChange={setModelParams}
      />

      <ToolToggleList
        enabledTools={agentConfig.enabledTools}
        icon={<Puzzle className='w-5 h-5' />}
        title='ブラウザ操作ツール'
        tools={BROWSER_TOOL_META}
        onToggle={toggleTool}
      />

      {availableIntegrationTools.length > 0 && (
        <ToolToggleList
          enabledTools={agentConfig.enabledTools}
          icon={<Plug className='w-5 h-5' />}
          title='連携サービスツール'
          tools={availableIntegrationTools}
          onToggle={toggleTool}
        />
      )}

      <McpToolIntegration
        disabledMcpTools={agentConfig.disabledMcpTools || []}
        enabledMcpServers={agentConfig.enabledMcpServers}
        mcpServers={mcpServers}
        onToggleServer={toggleMcpServer}
        onToggleTool={toggleMcpTool}
      />

      <MiddlewareSettings
        enabledMiddlewares={agentConfig.enabledMiddlewares || []}
        middlewareSettings={agentConfig.middlewareSettings}
        onToggle={toggleMiddleware}
        onUpdateSettings={updateMiddlewareSettings}
      />

      <MiscSettings recursionLimit={agentConfig.recursionLimit} onRecursionLimitChange={setRecursionLimit} />
    </div>
  );
}
