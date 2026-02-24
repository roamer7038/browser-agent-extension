'use client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SidePanelHeader } from '@/components/layouts/side-panel-header';
import { SidePanelLayout } from '@/components/layouts/side-panel-layout';
import { useSettings } from '@/hooks/use-settings';
import { useMcpServers } from '@/hooks/use-mcp-servers';
import { LlmSettingsSection } from './llm-settings-section';
import { ToolSettingsSection } from './tool-settings-section';
import { McpServerSection } from './mcp-server-section';

export function SettingsInterface({ onBack }: { onBack: () => void }) {
  const {
    llmConfig,
    setLlmConfig,
    llmStatus,
    saveLlmConfig,
    enabledTools,
    handleToolToggle,
    toolStatus,
    saveToolSettings
  } = useSettings();

  const mcpServerProps = useMcpServers();

  return (
    <SidePanelLayout>
      <SidePanelHeader
        title='Settings'
        leftActions={
          <Button className='h-8 w-8' size='icon' variant='ghost' onClick={onBack} title='Back'>
            <ArrowLeft className='w-4 h-4' />
          </Button>
        }
      />

      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        <LlmSettingsSection
          llmConfig={llmConfig}
          setLlmConfig={setLlmConfig}
          llmStatus={llmStatus}
          saveLlmConfig={saveLlmConfig}
        />

        <ToolSettingsSection
          enabledTools={enabledTools}
          handleToolToggle={handleToolToggle}
          toolStatus={toolStatus}
          saveToolSettings={saveToolSettings}
        />

        <McpServerSection {...mcpServerProps} />
      </div>
    </SidePanelLayout>
  );
}
