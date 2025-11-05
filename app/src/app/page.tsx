"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { NewChatButton } from "@/components/chat/NewChatButton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Loader2 } from "lucide-react";

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
    setStreamingContent("");

    try {
      if (mode === "text") {
        // Prepare messages for OpenAI API
        const apiMessages = [
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user" as const, content },
        ];

        // Call the streaming API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;
            setStreamingContent(accumulatedContent);
          }
        }

        // Save the final message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: accumulatedContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
        setIsLoading(false);
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
      setStreamingContent("");
      setIsLoading(false);

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
          <NewChatButton onClick={handleNewChat} disabled={
            isLoading || messages.length === 0
          } />
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

      {/* Input Area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={inputPlaceholder}
      />
    </div>
  );
}
