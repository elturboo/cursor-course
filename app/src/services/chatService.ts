import { ApiMessage } from "@/types/chat";

export interface ChatResponse {
  stream: ReadableStream<Uint8Array>;
}

export class ChatService {
  // Construct Edge Function endpoint from Supabase URL
  private static getChatEndpoint(): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
    }
    return `${supabaseUrl}/functions/v1/chat`;
  }

  // Get Supabase anon key from environment variables
  // Never hardcode API keys in frontend code
  private static getAnonKey(): string {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured");
    }
    return anonKey;
  }

  /**
   * Sends a chat message and returns a streaming response
   */
  static async sendMessage(
    messages: ApiMessage[]
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(this.getChatEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAnonKey()}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      // Don't expose detailed error information to users
      const errorData = await response.json().catch(() => ({}));
      // Only expose generic error messages to prevent information leakage
      const errorMessage =
        response.status === 401
          ? "Authentication failed. Please try again."
          : response.status === 403
          ? "Access denied."
          : response.status >= 500
          ? "Server error. Please try again later."
          : errorData.error || "Failed to send message. Please try again.";
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    return response.body;
  }

  /**
   * Reads a streaming response and calls a callback for each chunk
   */
  static async streamResponse(
    stream: ReadableStream<Uint8Array>,
    onChunk: (content: string) => void
  ): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        onChunk(accumulatedContent);
      }
    } finally {
      reader.releaseLock();
    }

    return accumulatedContent;
  }

  /**
   * Generates an image from a text prompt
   */
  static async generateImage(prompt: string): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getAnonKey()}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      // Don't expose detailed error information to users
      const errorData = await response.json().catch(() => ({}));
      // Only expose generic error messages to prevent information leakage
      const errorMessage =
        response.status === 401
          ? "Authentication failed. Please try again."
          : response.status === 403
          ? "Access denied."
          : response.status >= 500
          ? "Server error. Please try again later."
          : errorData.error || "Failed to generate image. Please try again.";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.imageUrl) {
      throw new Error("No image URL returned from API");
    }

    return data.imageUrl;
  }
}
