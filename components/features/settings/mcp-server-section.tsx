'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react';
import { McpServerDialog } from './mcp-server-dialog';
import type { McpServerConfig, TestResult } from '@/lib/types/settings';

interface McpServerSectionProps {
  servers: McpServerConfig[];
  testResults: Record<string, TestResult>;
  testingServerId: string | null;
  addServer: (server: Omit<McpServerConfig, 'id'>) => Promise<void>;
  updateServer: (id: string, updates: Partial<McpServerConfig>) => Promise<void>;
  deleteServer: (id: string) => Promise<void>;
  testConnection: (server: McpServerConfig) => Promise<void>;
  toggleServer: (id: string, enabled: boolean) => Promise<void>;
}

export function McpServerSection({
  servers,
  testResults,
  testingServerId,
  addServer,
  updateServer,
  deleteServer,
  testConnection,
  toggleServer
}: McpServerSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null);

  const openAddDialog = () => {
    setEditingServer(null);
    setDialogOpen(true);
  };

  const openEditDialog = (server: McpServerConfig) => {
    setEditingServer(server);
    setDialogOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    url: string;
    transport: 'sse' | 'http';
    headers: Record<string, string>;
  }) => {
    if (editingServer) {
      await updateServer(editingServer.id, data);
    } else {
      await addServer({ ...data, enabled: true });
    }
  };

  const formatTestResult = (result: TestResult): string => {
    if (result.success) {
      return `接続成功（ツール: ${result.toolCount}個）`;
    }
    return `接続失敗: ${result.error}`;
  };

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>外部MCPサーバ</CardTitle>
          <Button size='sm' variant='outline' onClick={openAddDialog}>
            <Plus className='w-4 h-4 mr-1' />
            追加
          </Button>
        </CardHeader>
        <CardContent className='space-y-3'>
          {servers.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-4'>MCPサーバが登録されていません</p>
          ) : (
            servers.map((server) => (
              <div key={server.id} className='border rounded-lg p-3 space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <Switch
                      checked={server.enabled}
                      id={`mcp-${server.id}`}
                      onCheckedChange={(checked) => toggleServer(server.id, checked)}
                    />
                    <div className='min-w-0'>
                      <p className='text-sm font-medium truncate'>{server.name}</p>
                      <p className='text-xs text-muted-foreground truncate'>{server.url}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1 shrink-0'>
                    <Button
                      disabled={testingServerId === server.id}
                      size='icon'
                      title='疎通確認'
                      variant='ghost'
                      onClick={() => testConnection(server)}
                    >
                      {testingServerId === server.id ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Wifi className='w-4 h-4' />
                      )}
                    </Button>
                    <Button size='icon' title='編集' variant='ghost' onClick={() => openEditDialog(server)}>
                      <Pencil className='w-4 h-4' />
                    </Button>
                    <Button size='icon' title='削除' variant='ghost' onClick={() => deleteServer(server.id)}>
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
                {testResults[server.id] && (
                  <p
                    className={`text-xs px-2 py-1 rounded ${
                      testResults[server.id].success
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {testResults[server.id].success ? (
                      <Wifi className='w-3 h-3 inline mr-1' />
                    ) : (
                      <WifiOff className='w-3 h-3 inline mr-1' />
                    )}
                    {formatTestResult(testResults[server.id])}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <McpServerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingServer={editingServer}
        onSave={handleSave}
      />
    </>
  );
}
