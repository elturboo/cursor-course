"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { NewChatButton } from "@/components/chat/NewChatButton";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

type ChatMode = "text" | "image";

export default function ChatDemoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<ChatMode>("text");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (mode === "text") {
        // TODO: Implement streaming text response
        // For now, add a placeholder response
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "This is a placeholder response. Streaming functionality will be implemented next.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
      } else {
        // TODO: Implement image generation
        // For now, add a placeholder response
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Image generation will be implemented next.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setStreamingContent("");
    setIsLoading(false);
  };

  const inputPlaceholder =
    mode === "text"
      ? "Type your message..."
      : "Describe the image you want to generate...";

  return (
    <div className="flex h-screen flex-col bg-background max-w-screen-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Turbo Chat App</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ModeToggle mode={mode} onModeChange={setMode} />
          <NewChatButton onClick={handleNewChat} />
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="flex min-h-full flex-col">
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-semibold text-foreground">
                  Welcome to Chat App
                </h2>
                <p className="text-muted-foreground">
                  {mode === "text"
                    ? "Start a conversation by typing a message below."
                    : "Describe an image you'd like to generate."}
                </p>
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
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={inputPlaceholder}
      />
    </div>
  );
}
