import { useEffect } from 'react';
import { useAgentStore } from '@/lib/store/agent-store';
import { useChatStream } from './use-chat-stream';

export function useAgent() {
  const messages = useAgentStore((state) => state.messages);
  const isLoading = useAgentStore((state) => state.isLoading);
  const threadId = useAgentStore((state) => state.threadId);
  const tokenUsage = useAgentStore((state) => state.tokenUsage);

  const appendUserMessage = useAgentStore((state) => state.appendUserMessage);
  const startNewThread = useAgentStore((state) => state.startNewThread);
  const switchThread = useAgentStore((state) => state.switchThread);
  const abortGeneration = useAgentStore((state) => state.abortGeneration);
  const initializeLastActiveThread = useAgentStore((state) => state.initializeLastActiveThread);

  const { setupStreamListener } = useChatStream();

  const sendMessage = async (content: string) => {
    try {
      const newBaseMessages = appendUserMessage(content);
      const port = chrome.runtime.connect({ name: 'chat_stream' });

      port.postMessage({
        type: 'chat_message',
        message: { role: 'user', content },
        threadId: useAgentStore.getState().threadId
      });

      setupStreamListener(port, newBaseMessages);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      useAgentStore
        .getState()
        .setMessages([...useAgentStore.getState().messages, { role: 'error', content: errorMsg, type: 'text' }]);
      useAgentStore.getState().setIsLoading(false);
    }
  };

  // Initial load of last active thread
  useEffect(() => {
    initializeLastActiveThread();
  }, [initializeLastActiveThread]);

  return {
    messages,
    isLoading,
    sendMessage,
    startNewThread,
    setThreadId: switchThread,
    tokenUsage,
    abortGeneration
  };
}
