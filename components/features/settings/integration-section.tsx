import { useEffect, useState } from 'react';
import { useIntegrationStore } from '@/lib/store/integration-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Plug } from 'lucide-react';
import type { IntegrationConfig } from '@/lib/types/integrations';

export function IntegrationSection() {
  const { configs, isLoading, error, loadConfigs, updateConfig, testConnection } = useIntegrationStore();
  const [testStatuses, setTestStatuses] = useState<Record<string, { success?: boolean; text: string }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleToggle = async (config: IntegrationConfig, enabled: boolean) => {
    await updateConfig({ ...config, enabled });
  };

  const handleApiKeyChange = async (config: IntegrationConfig, apiKey: string) => {
    await updateConfig({ ...config, apiKey });
  };

  const handleBaseUrlChange = async (config: IntegrationConfig, baseUrl: string) => {
    const settings = { ...config.settings, baseUrl };
    await updateConfig({ ...config, settings });
  };

  const handleTestConnection = async (config: IntegrationConfig) => {
    setTestingId(config.id);
    setTestStatuses((prev) => ({ ...prev, [config.id]: { text: 'Testing...' } }));

    try {
      const result = await testConnection(config);
      if (result.success) {
        setTestStatuses((prev) => ({
          ...prev,
          [config.id]: { success: true, text: `Connected! ${result.toolCount} tools available.` }
        }));
      } else {
        setTestStatuses((prev) => ({ ...prev, [config.id]: { success: false, text: result.error || 'Failed' } }));
      }
    } catch (e: any) {
      setTestStatuses((prev) => ({ ...prev, [config.id]: { success: false, text: e.message } }));
    } finally {
      setTestingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='w-6 h-6 animate-spin' />
      </div>
    );
  }

  if (error) {
    return <div className='p-4 text-red-500'>Error: {error}</div>;
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <h2 className='text-lg font-semibold tracking-tight flex items-center gap-2'>
            <Plug className='w-5 h-5' />
            連携サービス設定
          </h2>
          <p className='text-sm text-muted-foreground'>ウェブサービスや外部APIの認証情報を管理します。</p>
        </div>
      </div>

      {configs.length === 0 ? (
        <p className='text-sm text-muted-foreground'>利用可能な連携サービスがありません。</p>
      ) : (
        <div className='space-y-4'>
          {configs.map((config) => (
            <Card key={config.id}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle>{config.name}</CardTitle>
                <Switch checked={config.enabled} onCheckedChange={(checked) => handleToggle(config, checked)} />
              </CardHeader>
              <CardContent className='space-y-4'>
                {config.id !== 'ollama' && (
                  <div className='space-y-2 pt-2'>
                    <Label>Base URL (Optional)</Label>
                    <Input
                      value={config.settings?.baseUrl || ''}
                      placeholder='https://api.example.com'
                      onChange={(e) => handleBaseUrlChange(config, e.target.value)}
                    />
                  </div>
                )}
                <div className='space-y-2'>
                  <Label>API Key (Required for Ollama)</Label>
                  <Input
                    type='password'
                    value={config.apiKey || ''}
                    placeholder='Enter API Key'
                    onChange={(e) => handleApiKeyChange(config, e.target.value)}
                  />
                </div>
                <div className='flex items-center justify-between pt-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleTestConnection(config)}
                    disabled={testingId === config.id}
                  >
                    {testingId === config.id ? (
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    ) : (
                      <RefreshCw className='w-4 h-4 mr-2' />
                    )}
                    接続テスト
                  </Button>
                  {testStatuses[config.id] && (
                    <span className={`text-sm ${testStatuses[config.id].success ? 'text-green-500' : 'text-red-500'}`}>
                      {testStatuses[config.id].text}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
