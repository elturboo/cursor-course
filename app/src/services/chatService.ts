import { ApiMessage } from "@/types/chat";

export interface ChatResponse {
  stream: ReadableStream<Uint8Array>;
}

export class ChatService {
  private static readonly CHAT_API_ENDPOINT = "/api/chat";

  /**
   * Sends a chat message and returns a streaming response
   */
  static async sendMessage(
    messages: ApiMessage[]
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(this.CHAT_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

