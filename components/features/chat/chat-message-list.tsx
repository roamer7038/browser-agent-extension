import React, { useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Bot, Settings, ArchiveRestore, ChevronsUp, ChevronsDown, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { MarkdownRenderer } from './markdown-renderer';
import type { Message } from '@/lib/types/message';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  onImageClick?: (url: string) => void;
}

export interface ChatMessageListRef {
  scrollToBottom: (smooth?: boolean) => void;
}

export const ChatMessageList = React.forwardRef<ChatMessageListRef, ChatMessageListProps>(
  ({ messages, isLoading, onImageClick }, ref) => {
    const messagesTopRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const shouldAutoScroll = useRef(false);
    const isAutoScrolling = useRef<'up' | 'down' | false>(false);
    const lastScrollTopRef = useRef<number>(0);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const scrollToBottom = useCallback((smooth = true) => {
      isAutoScrolling.current = 'down';
      shouldAutoScroll.current = true;
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(
        () => {
          isAutoScrolling.current = false;
        },
        smooth ? 500 : 100
      );
    }, []);

    const scrollToTop = useCallback(() => {
      isAutoScrolling.current = 'up';
      shouldAutoScroll.current = false;
      messagesTopRef.current?.scrollIntoView({ behavior: 'smooth' });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isAutoScrolling.current = false;
      }, 500);
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToBottom
    }));

    const handleUserInteraction = useCallback(() => {
      isAutoScrolling.current = false;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    }, []);

    const handleScroll = useCallback(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      const isScrollable = scrollHeight > clientHeight;
      const isAtBottom = isScrollable && distanceToBottom <= 80;

      if (isAutoScrolling.current === 'down' && scrollTop < lastScrollTopRef.current) {
        isAutoScrolling.current = false;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      } else if (isAutoScrolling.current === 'up' && scrollTop > lastScrollTopRef.current) {
        isAutoScrolling.current = false;
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      }

      if (!isAutoScrolling.current) {
        shouldAutoScroll.current = isAtBottom;
      }

      lastScrollTopRef.current = scrollTop;
      setShowScrollTop(scrollTop > 80);
      setShowScrollBottom(isScrollable && distanceToBottom > 80);
    }, []);

    useEffect(() => {
      if (shouldAutoScroll.current) {
        scrollToBottom(false);
      } else {
        handleScroll();
      }
    }, [messages, isLoading, scrollToBottom, handleScroll]);

    return (
      <div
        ref={scrollContainerRef}
        className='relative flex-1 overflow-y-auto px-4 py-4'
        onScroll={handleScroll}
        onWheel={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onPointerDown={handleUserInteraction}
      >
        <div ref={messagesTopRef} />

        <div className='space-y-4'>
          {messages.length === 0 && (
            <div className='text-center text-muted-foreground mt-10'>
              <p>Hi! I&apos;m your browser agent.</p>
              <p className='text-sm'>How can I help you today?</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            if (msg.role === 'user') {
              return (
                <div key={idx} className='flex justify-end mb-4'>
                  <div className='bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap break-words'>
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.type === 'image') {
              return (
                <div key={idx} className='flex justify-start mb-4'>
                  <button
                    className='block rounded-lg overflow-hidden border shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in max-w-[85%] text-left bg-transparent p-0'
                    onClick={() => onImageClick?.(msg.content)}
                    title='クリックで原寸表示'
                    type='button'
                  >
                    <img alt='Screenshot' className='max-w-full block' src={msg.content} />
                  </button>
                </div>
              );
            }

            if (msg.role === 'system' && msg.type === 'system') {
              return (
                <div key={idx} className='flex justify-center mb-6 mt-2'>
                  <div className='flex items-center gap-2 bg-muted/60 text-muted-foreground border rounded-full px-4 py-1.5 text-xs'>
                    <ArchiveRestore className='w-3.5 h-3.5' />
                    <span>Conversation history has been summarized</span>
                  </div>
                </div>
              );
            }

            if (msg.role === 'reasoning') {
              return (
                <div key={idx} className='flex justify-start mb-4 w-full'>
                  <Accordion type='single' collapsible className='w-full max-w-[95%]'>
                    <AccordionItem
                      value={`reasoning-${idx}`}
                      className='border rounded-md bg-muted/30 px-3 last:border-b'
                    >
                      <AccordionTrigger className='py-2 text-xs text-muted-foreground hover:no-underline'>
                        <span className='flex items-center gap-2'>
                          <Bot className='w-3 h-3' />
                          Thinking Process
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className='text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono'>
                        {msg.content}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            }

            if (msg.role === 'tool') {
              return (
                <div key={idx} className='flex justify-start mb-4 w-full'>
                  <Accordion type='single' collapsible className='w-full max-w-[95%]'>
                    <AccordionItem value={`tool-${idx}`} className='border rounded-md bg-muted/30 px-3 last:border-b'>
                      <AccordionTrigger className='py-2 text-xs text-muted-foreground hover:no-underline'>
                        <span className='flex items-center gap-2'>
                          <Settings className='w-3 h-3' />
                          {msg.type === 'tool_result' ? `Tool Result: ${msg.name}` : `Tool Use: ${msg.name}`}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className='text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono'>
                        {msg.content}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            }

            return (
              <div key={idx} className='flex justify-start mb-4 w-full p-4'>
                <div
                  className={clsx(
                    'text-sm w-full max-w-[95%]',
                    msg.role === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 whitespace-pre-wrap'
                      : 'text-foreground'
                  )}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {msg.role === 'error' ? msg.content : <MarkdownRenderer content={msg.content} />}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className='flex justify-start mb-4 w-full'>
              <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                <Loader2 className='w-4 h-4 animate-spin' />
                Agent is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {(showScrollTop || showScrollBottom) && (
          <div className='sticky bottom-2 ml-auto mr-0 w-fit flex flex-col gap-1.5 z-20'>
            {showScrollTop && (
              <Button
                size='icon'
                variant='secondary'
                className='h-8 w-8 rounded-full shadow-md opacity-80 hover:opacity-100'
                onClick={scrollToTop}
                title='先頭へ'
              >
                <ChevronsUp className='w-4 h-4' />
              </Button>
            )}
            {showScrollBottom && (
              <Button
                size='icon'
                variant='secondary'
                className='h-8 w-8 rounded-full shadow-md opacity-80 hover:opacity-100'
                onClick={() => scrollToBottom(true)}
                title='末尾へ'
              >
                <ChevronsDown className='w-4 h-4' />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
ChatMessageList.displayName = 'ChatMessageList';
