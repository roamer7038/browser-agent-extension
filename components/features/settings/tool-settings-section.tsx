'use client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { BROWSER_TOOL_META } from '@/lib/agent/tools/tool-meta';

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'ナビゲーション',
  content: 'コンテンツ取得',
  interaction: 'ページ操作',
  screenshot: 'スクリーンショット',
  download: 'ダウンロード',
  tab: 'タブ管理'
};

interface ToolSettingsSectionProps {
  enabledTools: Set<string>;
  handleToolToggle: (toolName: string, checked: boolean) => void;
  toolStatus: 'idle' | 'saving' | 'saved';
  saveToolSettings: () => Promise<void>;
}

export function ToolSettingsSection({
  enabledTools,
  handleToolToggle,
  toolStatus,
  saveToolSettings
}: ToolSettingsSectionProps) {
  // Group tools by category
  const categories = Array.from(new Set(BROWSER_TOOL_META.map((t) => t.category)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>組込みツール</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {categories.map((category) => (
          <div key={category}>
            <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className='space-y-3'>
              {BROWSER_TOOL_META.filter((t) => t.category === category).map((tool) => (
                <div key={tool.name} className='flex items-start gap-3'>
                  <Switch
                    checked={enabledTools.has(tool.name)}
                    id={tool.name}
                    onCheckedChange={(checked) => handleToolToggle(tool.name, checked)}
                  />
                  <div className='flex flex-col gap-0.5'>
                    <Label className='cursor-pointer leading-none' htmlFor={tool.name}>
                      {tool.label}
                    </Label>
                    <p className='text-xs text-muted-foreground'>{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className='w-full' disabled={toolStatus === 'saving'} onClick={saveToolSettings}>
          {toolStatus === 'saving' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {toolStatus === 'saved' ? 'Saved!' : 'Save Tool Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
}
