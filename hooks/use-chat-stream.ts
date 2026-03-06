'use client';

import { useRef } from 'react';
import type { Message } from '@/lib/types/message';
import type { StreamMessage } from '@/lib/types/stream';
import { getFinalMessages } from '@/lib/utils/message-parser';
import { useAgentStore } from '@/lib/store/agent-store';

export function useChatStream() {
  const setMessages = useAgentStore((state) => state.setMessages);
  const setIsLoading = useAgentStore((state) => state.setIsLoading);
  const setThreadId = useAgentStore((state) => state.setThreadId);
  const setTokenUsage = useAgentStore((state) => state.setTokenUsage);
  const setActivePort = useAgentStore((state) => state.setActivePort);

  // React refs to hold mutable buffering state during a stream
  const currentTextRef = useRef('');
  const currentReasoningRef = useRef('');
  const accumulatedMessagesRef = useRef<Message[]>([]);

  const setupStreamListener = (port: chrome.runtime.Port, baseMessages: Message[]): void => {
    // Reset buffers for a new stream
    currentTextRef.current = '';
    currentReasoningRef.current = '';
    accumulatedMessagesRef.current = [];

    const handleMessage = (msg: StreamMessage): void => {
      switch (msg.type) {
        case 'stream_start': {
          if (msg.threadId) setThreadId(msg.threadId);
          break;
        }
        case 'stream_chunk': {
          const { chunk } = msg;

          if (chunk.content) currentTextRef.current += chunk.content;
          if (chunk.additional_kwargs?.reasoning_content) {
            currentReasoningRef.current += chunk.additional_kwargs.reasoning_content;
          }

          const tail: Message[] = [];
          if (currentReasoningRef.current) {
            tail.push({ role: 'reasoning', content: currentReasoningRef.current, type: 'reasoning' });
          }
          if (currentTextRef.current) {
            tail.push({ role: 'assistant', content: currentTextRef.current, type: 'text' });
          }

          setMessages([...baseMessages, ...accumulatedMessagesRef.current, ...tail]);
          break;
        }
        case 'tool_start': {
          if (currentReasoningRef.current) {
            accumulatedMessagesRef.current.push({
              role: 'reasoning',
              content: currentReasoningRef.current,
              type: 'reasoning'
            });
            currentReasoningRef.current = '';
          }
          if (currentTextRef.current) {
            accumulatedMessagesRef.current.push({ role: 'assistant', content: currentTextRef.current, type: 'text' });
            currentTextRef.current = '';
          }

          const toolCallInput = typeof msg.input === 'string' ? msg.input : JSON.stringify(msg.input);
          accumulatedMessagesRef.current.push({
            role: 'tool',
            name: msg.name,
            content: toolCallInput,
            type: 'tool_call'
          });

          setMessages([...baseMessages, ...accumulatedMessagesRef.current]);
          break;
        }
        case 'tool_end': {
          const toolResultOutput = typeof msg.output === 'string' ? msg.output : JSON.stringify(msg.output);
          accumulatedMessagesRef.current.push({
            role: 'tool',
            name: msg.name,
            content: toolResultOutput,
            type: 'tool_result'
          });

          setMessages([...baseMessages, ...accumulatedMessagesRef.current]);
          break;
        }
        case 'stream_abort': {
          setIsLoading(false);
          port.disconnect();
          break;
        }
        case 'stream_end': {
          if (msg.response.messages) {
            setMessages(getFinalMessages(msg.response));
          } else {
            setMessages([
              ...baseMessages,
              ...accumulatedMessagesRef.current,
              { role: 'assistant', content: msg.response.response || '', type: 'text' }
            ]);
          }
          if (msg.response.totalUsage) setTokenUsage(msg.response.totalUsage);
          if (msg.response.threadId) setThreadId(msg.response.threadId);
          setIsLoading(false);
          port.disconnect();
          break;
        }
        case 'error': {
          setMessages([
            ...baseMessages,
            ...accumulatedMessagesRef.current,
            { role: 'error', content: msg.error, type: 'text' }
          ]);
          setIsLoading(false);
          port.disconnect();
          break;
        }
        default:
          break;
      }
    };

    port.onMessage.addListener(handleMessage);

    port.onDisconnect.addListener(() => {
      setActivePort(null);
      setIsLoading(false);
    });

    setActivePort(port);
  };

  return {
    setupStreamListener
  };
}
