'use client';

import { useState, useRef, useCallback } from 'react';
import { useAgent } from '@/hooks/use-agent';
import { Button } from '@/components/ui/button';
import { Settings, History, Plus } from 'lucide-react';
import { SidePanelHeader } from '@/components/layouts/side-panel-header';
import { SidePanelLayout } from '@/components/layouts/side-panel-layout';
import { ChatMessageList, type ChatMessageListRef } from './chat-message-list';
import { ChatInputArea } from './chat-input-area';

export function ChatInterface({ onSettings, onHistory }: { onSettings: () => void; onHistory: () => void }) {
  const { messages, isLoading, sendMessage, startNewThread, tokenUsage, abortGeneration } = useAgent();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messageListRef = useRef<ChatMessageListRef>(null);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
      messageListRef.current?.scrollToBottom(true);
    },
    [sendMessage]
  );

  return (
    <SidePanelLayout>
      <SidePanelHeader
        title='Conduit'
        leftActions={
          <>
            <Button size='icon' variant='ghost' onClick={onHistory} title='History'>
              <History className='w-4 h-4' />
            </Button>
            <Button size='icon' variant='ghost' onClick={startNewThread} title='New Chat'>
              <Plus className='w-4 h-4' />
            </Button>
          </>
        }
        rightActions={
          <Button size='icon' variant='ghost' onClick={onSettings} title='Settings'>
            <Settings className='w-4 h-4' />
          </Button>
        }
      />

      <ChatMessageList ref={messageListRef} messages={messages} isLoading={isLoading} onImageClick={setSelectedImage} />

      <ChatInputArea isLoading={isLoading} tokenUsage={tokenUsage} onSend={handleSend} onAbort={abortGeneration} />

      {/* Screenshot fullscreen modal */}
      {selectedImage && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out'
          onClick={() => setSelectedImage(null)}
        >
          <img
            alt='Screenshot full size'
            className='max-w-[95%] max-h-[95%] object-contain rounded-lg shadow-2xl'
            src={selectedImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </SidePanelLayout>
  );
}
