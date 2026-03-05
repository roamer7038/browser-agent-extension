import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/lib/store/agent-store';

export function useAgent() {
  const messages = useAgentStore((state) => state.messages);
  const isLoading = useAgentStore((state) => state.isLoading);
  const threadId = useAgentStore((state) => state.threadId);
  const tokenUsage = useAgentStore((state) => state.tokenUsage);

  const sendMessage = useAgentStore((state) => state.sendMessage);
  const startNewThread = useAgentStore((state) => state.startNewThread);
  const setThreadId = useAgentStore((state) => state.setThreadId);
  const abortGeneration = useAgentStore((state) => state.abortGeneration);
  const loadThreadHistory = useAgentStore((state) => state.loadThreadHistory);
  const initializeLastActiveThread = useAgentStore((state) => state.initializeLastActiveThread);

  const skipHistoryFetchRef = useRef(false);

  // Load message history when threadId changes
  useEffect(() => {
    if (threadId) {
      if (skipHistoryFetchRef.current) {
        skipHistoryFetchRef.current = false;
        return;
      }
      loadThreadHistory(threadId);
    } else {
      useAgentStore.setState({ messages: [], tokenUsage: null });
    }
  }, [threadId, loadThreadHistory]);

  // Initial load of last active thread
  useEffect(() => {
    initializeLastActiveThread();
  }, [initializeLastActiveThread]);

  const handleSendMessage = (content: string) => {
    skipHistoryFetchRef.current = true;
    return sendMessage(content);
  };

  return {
    messages,
    isLoading,
    sendMessage: handleSendMessage,
    startNewThread,
    setThreadId,
    tokenUsage,
    abortGeneration
  };
}
