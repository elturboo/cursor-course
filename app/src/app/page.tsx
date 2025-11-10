"use client";
import React from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessagesArea } from "@/components/chat/MessagesArea";
import { useChat } from "@/hooks/useChat";
import { getInputPlaceholder, getWelcomeMessage } from "@/utils/chatUtils";

export default function ChatDemoPage() {
  const {
    messages,
    mode,
    isLoading,
    streamingContent,
    setMode,
    sendMessage,
    newChat,
    scrollRef,
  } = useChat();

  const inputPlaceholder = getInputPlaceholder(mode);
  const { title, description } = getWelcomeMessage(mode);

  return (
    <div className="flex h-screen flex-col bg-background max-w-screen-lg mx-auto">
      <ChatHeader
        mode={mode}
        onModeChange={setMode}
        onNewChat={newChat}
        isLoading={isLoading}
        messages={messages}
      />

      <MessagesArea
        messages={messages}
        streamingContent={streamingContent}
        isLoading={isLoading}
        title={title}
        description={description}
        scrollRef={scrollRef}
      />

      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        placeholder={inputPlaceholder}
      />
    </div>
  );
}
