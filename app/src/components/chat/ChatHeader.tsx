"use client";
import React from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { NewChatButton } from "@/components/chat/NewChatButton";
import type { Message } from "@/types/chat";

interface ChatHeaderProps {
  mode: "text" | "image";
  onModeChange: (mode: "text" | "image") => void;
  onNewChat: () => void;
  isLoading: boolean;
  messages: Message[];
}

export function ChatHeader({
  mode,
  onModeChange,
  onNewChat,
  isLoading,
  messages,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Turbo Chat App</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ModeToggle mode={mode} onModeChange={onModeChange} />
        <NewChatButton
          onClick={onNewChat}
          disabled={isLoading || messages.length === 0}
        />
      </div>
    </header>
  );
}

