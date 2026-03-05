import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square, BarChart3 } from 'lucide-react';
import type { ThreadTokenUsage } from '@/lib/types/message';

interface ChatInputAreaProps {
  isLoading: boolean;
  tokenUsage: ThreadTokenUsage | null;
  onSend: (message: string) => void;
  onAbort: () => void;
}

export function ChatInputArea({ isLoading, tokenUsage, onSend, onAbort }: ChatInputAreaProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const content = inputRef.current?.value.trim();
    if (content) {
      onSend(content);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='shrink-0 px-4 py-3 border-t bg-background z-10'>
      <div className='flex flex-col rounded-xl border bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-primary shadow-sm transition-colors'>
        <Textarea
          ref={inputRef}
          className='min-h-[36px] max-h-[120px] resize-none border-0 focus-visible:ring-0 shadow-none text-sm p-3 rounded-t-xl rounded-b-none'
          placeholder='Type a message...'
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
        <div className='flex justify-between items-center pl-4 pr-2 pb-2 pt-1 bg-transparent'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            {tokenUsage && tokenUsage.totalTokens > 0 && (
              <div className='group relative flex items-center gap-1 text-[11px] text-muted-foreground cursor-default'>
                <BarChart3 className='w-3 h-3' />
                <span>{tokenUsage.totalTokens.toLocaleString()} tokens</span>
                <div className='absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-30'>
                  <div className='bg-popover text-popover-foreground border rounded-md px-3 py-2 text-[11px] shadow-md whitespace-nowrap'>
                    <div className='flex flex-col gap-0.5'>
                      <span>Input: {tokenUsage.inputTokens.toLocaleString()}</span>
                      <span>Output: {tokenUsage.outputTokens.toLocaleString()}</span>
                      <span className='text-muted-foreground/70 pt-0.5 border-t mt-0.5'>
                        Current context window usage
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {isLoading ? (
            <Button
              size='icon'
              onClick={onAbort}
              variant='destructive'
              className='h-8 w-8 rounded-full shrink-0'
              title='Stop generation'
            >
              <Square className='w-3 h-3 fill-current' />
            </Button>
          ) : (
            <Button size='icon' onClick={handleSend} disabled={isLoading} className='h-8 w-8 rounded-full shrink-0'>
              <Send className='w-4 h-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
