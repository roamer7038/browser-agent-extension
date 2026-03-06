import { z } from 'zod';
import type { Message } from '@/lib/types/message';

// ---------------------------------------------------------------------------
// Schemas for incoming raw messages
// ---------------------------------------------------------------------------

const BaseRawMessageSchema = z.object({
  id: z.any().optional(),
  type: z.string().optional(),
  content: z.any(),
  additional_kwargs: z.record(z.string(), z.any()).optional(),
  name: z.string().optional()
});

const AiRawMessageSchema = BaseRawMessageSchema.extend({
  tool_calls: z.array(z.record(z.string(), z.any())).optional(),
  usage_metadata: z.record(z.string(), z.any()).optional()
});

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function extractMessageType(m: any): string | null {
  if (typeof m.getType === 'function') {
    return m.getType();
  }
  if (m.type) {
    return m.type;
  }
  const idStr = String(m.id || '');
  if (idStr.includes('AI')) return 'ai';
  if (idStr.includes('Human')) return 'human';
  return null;
}

function parseContent(content: any): string {
  if (typeof content === 'string') return content;
  return JSON.stringify(content);
}

// ---------------------------------------------------------------------------
// Message Handlers
// ---------------------------------------------------------------------------

function handleHumanMessage(m: any): Message[] {
  const parsed = BaseRawMessageSchema.safeParse(m);
  if (!parsed.success) return [];
  const { content, additional_kwargs } = parsed.data;

  const strContent = parseContent(content);
  if (additional_kwargs?.lc_source === 'summarization') {
    return [{ role: 'system', content: strContent, type: 'system' }];
  }
  return [{ role: 'user', content: strContent, type: 'text' }];
}

function handleAiMessage(m: any): Message[] {
  const parsed = AiRawMessageSchema.safeParse(m);
  if (!parsed.success) return [];
  const { content, additional_kwargs, tool_calls, usage_metadata } = parsed.data;

  const msgs: Message[] = [];

  if (additional_kwargs?.reasoning_content) {
    msgs.push({
      role: 'reasoning',
      content: String(additional_kwargs.reasoning_content),
      type: 'reasoning'
    });
  }

  if (tool_calls && tool_calls.length > 0) {
    tool_calls.forEach((tc) => {
      msgs.push({
        role: 'tool',
        content: JSON.stringify(tc.args || {}),
        name: String(tc.name || ''),
        type: 'tool_call'
      });
    });
  }

  const strContent = parseContent(content);
  if (strContent && strContent.trim() && strContent !== '""' && strContent !== '{}') {
    msgs.push({
      role: 'assistant',
      content: strContent,
      type: 'text',
      usageMetadata: usage_metadata as Message['usageMetadata']
    });
  }

  return msgs;
}

function handleToolMessage(m: any): Message[] {
  const parsed = BaseRawMessageSchema.safeParse(m);
  if (!parsed.success) return [];
  const { content, name } = parsed.data;

  return [
    {
      role: 'tool',
      content: parseContent(content),
      name: String(name || ''),
      type: 'tool_result'
    }
  ];
}

function handleSystemOrErrorMessage(m: any): Message[] {
  const parsed = BaseRawMessageSchema.safeParse(m);
  if (!parsed.success) return [];

  return [
    {
      role: 'error',
      content: parseContent(parsed.data.content),
      type: 'text'
    }
  ];
}

// ---------------------------------------------------------------------------
// Main Parsers
// ---------------------------------------------------------------------------

export function parseMessages(rawMessages: Record<string, unknown>[]): Message[] {
  return rawMessages.flatMap((m) => {
    const msgType = extractMessageType(m);

    switch (msgType) {
      case 'human':
        return handleHumanMessage(m);
      case 'ai':
        return handleAiMessage(m);
      case 'tool':
        return handleToolMessage(m);
      case 'system':
      case 'error':
        return handleSystemOrErrorMessage(m);
      default:
        // Unknown types are ignored or could be logged
        return [];
    }
  });
}

/** Input structure for getFinalMessages, compatible with StreamEndResponse and ThreadHistory */
interface FinalMessagesInput {
  messages: unknown[];
  screenshots?: string[];
}

export function getFinalMessages(response: FinalMessagesInput): Message[] {
  if (!response || !Array.isArray(response.messages)) return [];

  const formattedMessages = parseMessages(response.messages as Record<string, unknown>[]);
  const screenshots: string[] = Array.isArray(response.screenshots) ? response.screenshots : [];

  const screenshotMessages: Message[] = screenshots.map((url) => ({
    role: 'assistant',
    content: String(url),
    type: 'image'
  }));

  return [...formattedMessages, ...screenshotMessages];
}
