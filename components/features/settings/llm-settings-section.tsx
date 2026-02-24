'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxCollection
} from '@/components/ui/combobox';
import { useModelSelection } from '@/hooks/use-model-selection';
import type { LLMConfig } from '@/lib/types/agent';

interface LlmSettingsSectionProps {
  llmConfig: LLMConfig;
  setLlmConfig: (config: LLMConfig) => void;
  llmStatus: 'idle' | 'saving' | 'saved';
  saveLlmConfig: () => Promise<void>;
}

export function LlmSettingsSection({ llmConfig, setLlmConfig, llmStatus, saveLlmConfig }: LlmSettingsSectionProps) {
  const { availableModels, modelsLoading, handleRefreshModels } = useModelSelection();

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Configuration</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='baseUrl'>Base URL</Label>
          <Input
            id='baseUrl'
            placeholder='https://api.openai.com/v1'
            type='text'
            value={llmConfig.baseUrl || ''}
            onChange={(e) => setLlmConfig({ ...llmConfig, baseUrl: e.target.value })}
          />
          <p className='text-xs text-muted-foreground'>
            OpenAI互換プロバイダ用のエンドポイントを指定します（例:
            OpenRouter、Ollama）。OpenAIを使用する場合は空のままにしてください。
          </p>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='apiKey'>OpenAI API Key</Label>
          <Input
            id='apiKey'
            placeholder='sk-...'
            type='password'
            value={llmConfig.apiKey}
            onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='modelName'>Model Name</Label>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <Combobox
                value={llmConfig.modelName || ''}
                onValueChange={(value) => setLlmConfig({ ...llmConfig, modelName: value || '' })}
                items={availableModels}
              >
                <ComboboxInput placeholder='モデルを検索または入力...' disabled={modelsLoading} showClear />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(model) => (
                        <ComboboxItem key={model} value={model}>
                          {model}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                    <ComboboxEmpty>{modelsLoading ? 'モデルを読み込み中...' : 'モデルが見つかりません'}</ComboboxEmpty>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <Button
              variant='outline'
              size='icon'
              onClick={handleRefreshModels}
              disabled={modelsLoading}
              title='モデルリストを更新'
            >
              {modelsLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <RefreshCw className='w-4 h-4' />}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            設定保存後に更新ボタンをクリックすると、利用可能なモデル一覧を取得できます。
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className='w-full' disabled={llmStatus === 'saving'} onClick={saveLlmConfig}>
          {llmStatus === 'saving' && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {llmStatus === 'saved' ? 'Saved!' : 'Save LLM Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
}
