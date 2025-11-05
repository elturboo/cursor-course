import { useState, useRef, useEffect, useCallback } from "react";
import { Message, ChatMode, ApiMessage } from "@/types/chat";
import { ChatService } from "@/services/chatService";

interface UseChatOptions {
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  messages: Message[];
  mode: ChatMode;
  isLoading: boolean;
  streamingContent: string;
  setMode: (mode: ChatMode) => void;
  sendMessage: (content: string) => Promise<void>;
  newChat: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<ChatMode>("text");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  /**
   * Creates a new user message
   */
  const createUserMessage = useCallback((content: string): Message => {
    return {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
  }, []);

  /**
   * Creates a new assistant message
   */
  const createAssistantMessage = useCallback((content: string): Message => {
    return {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  }, []);

  /**
   * Creates an error message
   */
  const createErrorMessage = useCallback((error: Error): Message => {
    return {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Error: ${error.message}`,
      timestamp: new Date(),
    };
  }, []);

  /**
   * Converts messages to API format
   */
  const convertToApiMessages = useCallback(
    (messages: Message[], newContent: string): ApiMessage[] => {
      return [
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user" as const, content: newContent },
      ];
    },
    []
  );

  /**
   * Handles text mode chat
   */
  const handleTextMode = useCallback(
    async (content: string) => {
      const apiMessages = convertToApiMessages(messages, content);

      const stream = await ChatService.sendMessage(apiMessages);
      const finalContent = await ChatService.streamResponse(
        stream,
        setStreamingContent
      );

      const assistantMessage = createAssistantMessage(finalContent);
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    },
    [messages, convertToApiMessages, createAssistantMessage]
  );

  /**
   * Handles image mode chat (placeholder for future implementation)
   */
  const handleImageMode = useCallback(async (content: string) => {
    // TODO: Implement image generation
    // For now, add a placeholder response
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const assistantMessage = createAssistantMessage(
          "Image generation will be implemented next."
        );
        setMessages((prev) => [...prev, assistantMessage]);
        resolve();
      }, 1500);
    });
  }, [createAssistantMessage]);

  /**
   * Sends a message based on the current mode
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMessage = createUserMessage(content);
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");

      try {
        if (mode === "text") {
          await handleTextMode(content);
        } else {
          await handleImageMode(content);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setStreamingContent("");

        const errorMessage = createErrorMessage(
          error instanceof Error
            ? error
            : new Error("Failed to send message")
        );
        setMessages((prev) => [...prev, errorMessage]);

        if (options.onError && error instanceof Error) {
          options.onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      mode,
      createUserMessage,
      createErrorMessage,
      handleTextMode,
      handleImageMode,
      options,
    ]
  );

  /**
   * Starts a new chat session
   */
  const newChat = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    setIsLoading(false);
  }, []);

  return {
    messages,
    mode,
    isLoading,
    streamingContent,
    setMode,
    sendMessage,
    newChat,
    scrollRef,
  };
}

