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

  // Get Supabase anon key for local development
  // For production, this should be stored securely
  private static getAnonKey(): string {
    // Local development anon key (from Supabase local instance)
    // In production, use NEXT_PUBLIC_SUPABASE_ANON_KEY env variable
    return (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    );
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
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
}
