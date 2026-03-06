import { create } from 'zustand';
import type { Message, ThreadTokenUsage } from '@/lib/types/message';
import { getFinalMessages } from '../utils/message-parser';
import { sendMessage } from '../messaging';
import { ThreadRepository } from '../services/storage/repositories/thread-repository';

interface AgentState {
  messages: Message[];
  isLoading: boolean;
  threadId: string;
  tokenUsage: ThreadTokenUsage | null;
  activePort: chrome.runtime.Port | null;

  // Actions
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (isLoading: boolean) => void;
  setThreadId: (threadId: string) => void;
  setTokenUsage: (tokenUsage: ThreadTokenUsage | null) => void;
  setActivePort: (port: chrome.runtime.Port | null) => void;

  // Thunks
  appendUserMessage: (content: string) => Message[];
  startNewThread: () => void;
  switchThread: (newThreadId: string) => Promise<void>;
  abortGeneration: () => void;
  loadThreadHistory: (threadId: string) => Promise<void>;
  initializeLastActiveThread: () => Promise<void>;

  // Streaming Actions
  appendStreamChunk: (textChunk?: string, reasoningChunk?: string) => void;
  appendToolCall: (name: string, input: string) => void;
  appendToolResult: (name: string, output: string) => void;
  finalizeStream: (finalMessages?: Message[]) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
  isLoading: false,
  threadId: '',
  tokenUsage: null,
  activePort: null,

  setMessages: (updater) =>
    set((state) => ({
      messages: typeof updater === 'function' ? updater(state.messages) : updater
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setThreadId: (threadId) => set({ threadId }),
  setTokenUsage: (tokenUsage) => set({ tokenUsage }),
  setActivePort: (port) => set({ activePort: port }),

  appendUserMessage: (content: string) => {
    const state = get();
    const userMessage: Message = { role: 'user', content, type: 'text' };
    const newBaseMessages = [...state.messages, userMessage];
    set({ messages: newBaseMessages, isLoading: true });
    return newBaseMessages;
  },

  startNewThread: () => {
    set({ threadId: '', messages: [], tokenUsage: null });
    ThreadRepository.removeLastActiveId();
  },

  switchThread: async (newThreadId: string) => {
    const { threadId, loadThreadHistory } = get();
    if (threadId === newThreadId) return;

    set({ threadId: newThreadId });
    if (newThreadId) {
      await loadThreadHistory(newThreadId);
    } else {
      set({ messages: [], tokenUsage: null });
    }
  },

  abortGeneration: async () => {
    const { threadId, isLoading } = get();
    if (threadId && isLoading) {
      try {
        await sendMessage('cancel_generation', threadId);
        set({ isLoading: false });
      } catch (error) {
        console.error('Failed to cancel generation:', error);
      }
    }
  },

  loadThreadHistory: async (targetThreadId: string) => {
    if (!targetThreadId) {
      set({ messages: [], tokenUsage: null });
      return;
    }

    const state = get();
    // If we're already loading or sending a message, don't interrupt with history fetch
    if (state.isLoading) return;

    try {
      const response = await sendMessage('get_thread_history', targetThreadId);
      set({
        messages: getFinalMessages(response),
        tokenUsage: response.totalUsage || null
      });
    } catch (error) {
      console.error('Failed to load thread history', error);
    }
  },

  initializeLastActiveThread: async () => {
    const lastActiveThreadId = await ThreadRepository.getLastActiveId();
    if (lastActiveThreadId) {
      set({ threadId: lastActiveThreadId });
      await get().loadThreadHistory(lastActiveThreadId);
    }
  },

  appendStreamChunk: (textChunk = '', reasoningChunk = '') => {
    set((state) => {
      const messages = [...state.messages];
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

      if (reasoningChunk) {
        if (lastMsg && lastMsg.role === 'reasoning') {
          // Append to existing reasoning block
          messages[messages.length - 1] = { ...lastMsg, content: lastMsg.content + reasoningChunk };
        } else {
          // Create new reasoning block
          messages.push({ role: 'reasoning', content: reasoningChunk, type: 'reasoning' });
        }
      }

      if (textChunk) {
        // We re-evaluate lastMsg here in case a new reasoning block was added
        const currentLast = messages[messages.length - 1];
        if (currentLast && currentLast.role === 'assistant' && currentLast.type === 'text') {
          // Append to existing assistant text block
          messages[messages.length - 1] = { ...currentLast, content: currentLast.content + textChunk };
        } else {
          // Create new assistant text block
          messages.push({ role: 'assistant', content: textChunk, type: 'text' });
        }
      }

      return { messages };
    });
  },

  appendToolCall: (name: string, input: string) => {
    set((state) => ({
      messages: [...state.messages, { role: 'tool', name, content: input, type: 'tool_call' }]
    }));
  },

  appendToolResult: (name: string, output: string) => {
    set((state) => ({
      messages: [...state.messages, { role: 'tool', name, content: output, type: 'tool_result' }]
    }));
  },

  finalizeStream: (finalMessages?: Message[]) => {
    if (finalMessages && finalMessages.length > 0) {
      set({ messages: finalMessages, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  }
}));
