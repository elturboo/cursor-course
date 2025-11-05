export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

export type ChatMode = "text" | "image";

export interface ApiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatError {
  message: string;
  timestamp: Date;
}

