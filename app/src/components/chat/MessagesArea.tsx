"use client";
import React from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Loader2 } from "lucide-react";
import type { Message } from "@/types/chat";

interface MessagesAreaProps {
  messages: Message[];
  streamingContent?: string;
  isLoading: boolean;
  title: string;
  description: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function MessagesArea({
  messages,
  streamingContent,
  isLoading,
  title,
  description,
  scrollRef,
}: MessagesAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto" ref={scrollRef}>
      <div className="flex min-h-full flex-col">
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold text-foreground">
                {title}
              </h2>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            imageUrl={message.imageUrl}
          />
        ))}
        {streamingContent && (
          <ChatMessage
            role="assistant"
            content={streamingContent}
            isStreaming={true}
          />
        )}
        {isLoading && !streamingContent && (
          <div className="flex w-full gap-3 px-4 py-4 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              AI
            </div>
            <div className="flex max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3 bg-muted text-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

