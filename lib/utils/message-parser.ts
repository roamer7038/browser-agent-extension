import type { Message } from '@/lib/types/message';

export function parseMessages(rawMessages: Record<string, unknown>[]): Message[] {
  return rawMessages.flatMap((m) => {
    const msgs: Message[] = [];
    const msgType =
      (typeof m.getType === 'function' ? (m.getType as () => string)() : m.type) ||
      (m.id?.toString().includes('AI') ? 'ai' : m.id?.toString().includes('Human') ? 'human' : null);

    if (msgType === 'human') {
      const additionalKwargs = (m.additional_kwargs || {}) as Record<string, unknown>;
      if (additionalKwargs.lc_source === 'summarization') {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        msgs.push({ role: 'system', content, type: 'system' });
      } else {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        msgs.push({ role: 'user', content, type: 'text' });
      }
    } else if (msgType === 'ai') {
      const additionalKwargs = (m.additional_kwargs || {}) as Record<string, unknown>;
      if (additionalKwargs.reasoning_content) {
        msgs.push({ role: 'reasoning', content: additionalKwargs.reasoning_content as string, type: 'reasoning' });
      }
      if (m.tool_calls && (m.tool_calls as unknown[]).length > 0) {
        (m.tool_calls as Record<string, unknown>[]).forEach((tc) => {
          msgs.push({ role: 'tool', content: JSON.stringify(tc.args), name: tc.name as string, type: 'tool_call' });
        });
      }
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      if (content && content.trim() && content !== '""' && content !== '{}') {
        const usageMetadata = m.usage_metadata as Message['usageMetadata'] | undefined;
        msgs.push({ role: 'assistant', content, type: 'text', usageMetadata });
      }
    } else if (msgType === 'tool') {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      msgs.push({ role: 'tool', content, name: m.name as string, type: 'tool_result' });
    } else if (msgType === 'system' || msgType === 'error') {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      msgs.push({ role: 'error', content, type: 'text' });
    }
    return msgs;
  });
}

export function getFinalMessages(response: Record<string, unknown>): Message[] {
  if (!response.messages) return [];
  const formattedMessages = parseMessages(response.messages as Record<string, unknown>[]);
  const screenshots: string[] = (response.screenshots as string[]) ?? [];
  const screenshotMessages: Message[] = screenshots.map((url) => ({
    role: 'assistant',
    content: url,
    type: 'image'
  }));
  return [...formattedMessages, ...screenshotMessages];
}
