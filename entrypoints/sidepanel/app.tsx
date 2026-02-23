import { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { SettingsInterface } from '@/components/setting-interface';
import { HistoryInterface } from '@/components/history-interface';

function App() {
  const [view, setView] = useState<'chat' | 'settings' | 'history'>('chat');

  const handleSelectThread = async (threadId: string) => {
    await chrome.storage.local.set({ lastActiveThreadId: threadId });
    setView('chat');
  };

  return (
    <div className='w-full h-screen bg-background'>
      {view === 'chat' ? (
        <ChatInterface onSettings={() => setView('settings')} onHistory={() => setView('history')} />
      ) : view === 'settings' ? (
        <SettingsInterface onBack={() => setView('chat')} />
      ) : (
        <HistoryInterface onBack={() => setView('chat')} onSelectThread={handleSelectThread} />
      )}
    </div>
  );
}

export default App;
