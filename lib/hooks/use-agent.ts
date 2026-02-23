import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  type?: 'text' | 'image';
}

export function useAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>('');

  // Load message history when threadId changes
  useEffect(() => {
    if (threadId) {
      chrome.runtime
        .sendMessage({
          type: 'get_thread_history',
          threadId
        })
        .then((response) => {
          if (response.messages) {
            const formattedMessages: Message[] = response.messages
              .map((m: any): Message | null => {
                // type が human/ai 以外（tool, system など）は UI に表示しない
                const msgType: string =
                  (typeof m.getType === 'function' ? m.getType() : m.type) ||
                  (m.id?.includes('AI') ? 'ai' : m.id?.includes('Human') ? 'human' : null);

                if (msgType === 'human') {
                  const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                  return { role: 'user', content, type: 'text' };
                }
                if (msgType === 'ai') {
                  const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                  // content が空のAIメッセージ（ツール呼び出し中間ステップ）は除外
                  if (!content.trim()) return null;
                  return { role: 'assistant', content, type: 'text' };
                }
                // tool / system / function など → 表示しない
                return null;
              })
              .filter((m: Message | null): m is Message => m !== null);

            // スクリーンショットを末尾に追加（LLMコンテキスト外のUI専用データ）
            const screenshots: string[] = response.screenshots ?? [];
            const screenshotMessages: Message[] = screenshots.map((url) => ({
              role: 'assistant',
              content: url,
              type: 'image'
            }));

            setMessages([...formattedMessages, ...screenshotMessages]);
          }
        });
    } else {
      setMessages([]);
    }
  }, [threadId]);

  // Initial load of last active thread
  useEffect(() => {
    chrome.storage.local.get(['lastActiveThreadId']).then((data) => {
      if (data.lastActiveThreadId) {
        setThreadId(data.lastActiveThreadId as string);
      }
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setMessages((prev) => [...prev, { role: 'user', content }]);

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'chat_message',
          message: {
            role: 'user',
            content
          },
          threadId // Send current threadId, background will generate if empty
        });

        if (response.error) {
          setMessages((prev) => [...prev, { role: 'error', content: response.error }]);
        } else {
          const content: string = response.response ?? '';
          const nextMessages: Message[] = [{ role: 'assistant', content, type: 'text' }];
          // スクリーンショットはLLMコンテキストと分離してUIのみに表示
          if (response.screenshotDataUrl) {
            nextMessages.push({ role: 'assistant', content: response.screenshotDataUrl, type: 'image' });
          }
          setMessages((prev) => [...prev, ...nextMessages]);
          if (response.threadId) {
            setThreadId(response.threadId);
          }
        }
      } catch (error: any) {
        setMessages((prev) => [...prev, { role: 'error', content: error.message || 'Failed to send message' }]);
      } finally {
        setIsLoading(false);
      }
    },
    [threadId]
  );

  const startNewThread = useCallback(() => {
    setThreadId('');
    setMessages([]);
    chrome.storage.local.remove('lastActiveThreadId');
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    startNewThread,
    setThreadId
  };
}
