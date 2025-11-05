"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  imageUrl,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          AI
        </div>
      )}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2 rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {imageUrl && (
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-md">
            <img
              src={imageUrl}
              alt="Generated image"
              className="h-full w-full object-contain"
            />
          </div>
        )}
        {content && (
          <div className="prose-sm max-w-none ">
            <p className="whitespace-pre-wrap break-words">{content}</p>
            {isStreaming && (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current ml-1" />
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
          You
        </div>
      )}
    </div>
  );
}

