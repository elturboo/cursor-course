import { ChatMode } from "@/types/chat";

/**
 * Gets the appropriate placeholder text based on chat mode
 */
export function getInputPlaceholder(mode: ChatMode): string {
  return mode === "text"
    ? "Type your message..."
    : "Describe the image you want to generate...";
}

/**
 * Gets the welcome message based on chat mode
 */
export function getWelcomeMessage(mode: ChatMode): {
  title: string;
  description: string;
} {
  return {
    title: "Welcome to Chat App",
    description:
      mode === "text"
        ? "Start a conversation by typing a message below."
        : "Describe an image you'd like to generate.",
  };
}

