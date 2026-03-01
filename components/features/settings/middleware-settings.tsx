import { Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { AgentSettingsConfig } from '@/lib/types/agent';

interface MiddlewareSettingsProps {
  enabledMiddlewares: string[];
  middlewareSettings?: AgentSettingsConfig['middlewareSettings'];
  onToggle: (middlewareName: string, enabled: boolean) => void;
  onUpdateSettings: (settings: NonNullable<AgentSettingsConfig['middlewareSettings']>) => void;
}

const MIDDLEWARES = [
  {
    name: 'SummarizationMiddleware',
    label: '会話履歴の自動要約',
    description: 'コンテキストが長くなりすぎた場合に自動的に要約を行い、トークン数を削減します。'
  },
  {
    name: 'TodoListMiddleware',
    label: 'TODOリスト管理',
    description: 'エージェントが複数ステップのタスクを実行する際に、TODOリストを作成して進捗を管理します。'
  },
  {
    name: 'ToolCallLimitMiddleware',
    label: '外部ツール呼び出し制限',
    description: '外部MCPツールの1ターンあたりの呼び出し回数を制限し、過剰なツール使用を防止します。'
  }
];

export function MiddlewareSettings({
  enabledMiddlewares,
  middlewareSettings,
  onToggle,
  onUpdateSettings
}: MiddlewareSettingsProps) {
  const isSummarizationEnabled = enabledMiddlewares.includes('SummarizationMiddleware');
  const isToolCallLimitEnabled = enabledMiddlewares.includes('ToolCallLimitMiddleware');

  return (
    <div>
      <h2 className='text-lg font-semibold tracking-tight flex items-center gap-2 mb-4'>
        <Layers className='w-5 h-5' />
        エージェントミドルウェア
      </h2>
      <Card className='py-2'>
        <div className='divide-y'>
          {MIDDLEWARES.map((middleware) => (
            <div key={middleware.name} className='flex flex-col p-4 bg-card text-card-foreground gap-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label className='text-sm font-medium' htmlFor={`middleware-${middleware.name}`}>
                    {middleware.label}{' '}
                    <span className='text-xs text-muted-foreground font-normal'>({middleware.name})</span>
                  </Label>
                  <p className='text-xs text-muted-foreground'>{middleware.description}</p>
                </div>
                <Switch
                  checked={enabledMiddlewares.includes(middleware.name)}
                  id={`middleware-${middleware.name}`}
                  onCheckedChange={(checked) => onToggle(middleware.name, checked)}
                />
              </div>

              {middleware.name === 'SummarizationMiddleware' && isSummarizationEnabled && (
                <div className='pl-2 border-1 bg-muted/30 p-3 rounded-md mt-2 flex gap-4'>
                  <div className='flex-1 space-y-1.5'>
                    <Label htmlFor='summarization-max-tokens' className='text-xs text-muted-foreground'>
                      最大トークン数
                    </Label>
                    <Input
                      id='summarization-max-tokens'
                      type='number'
                      min={100}
                      step={100}
                      placeholder='100000'
                      className='h-8 text-sm'
                      value={middlewareSettings?.summarization?.maxTokens || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings({
                          summarization: {
                            ...middlewareSettings?.summarization,
                            maxTokens: isNaN(val) ? undefined : val
                          }
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {middleware.name === 'ToolCallLimitMiddleware' && isToolCallLimitEnabled && (
                <div className='pl-2 border-1 bg-muted/30 p-3 rounded-md mt-2 flex gap-4'>
                  <div className='flex-1 space-y-1.5'>
                    <Label htmlFor='tool-call-limit-run-limit' className='text-xs text-muted-foreground'>
                      1ターンあたりの最大呼び出し回数 (runLimit)
                    </Label>
                    <Input
                      id='tool-call-limit-run-limit'
                      type='number'
                      min={1}
                      step={1}
                      placeholder='20'
                      className='h-8 text-sm'
                      value={middlewareSettings?.toolCallLimit?.runLimit || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings({
                          toolCallLimit: {
                            ...middlewareSettings?.toolCallLimit,
                            runLimit: isNaN(val) ? undefined : val
                          }
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
