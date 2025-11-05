import { NextRequest } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Static reply mode - set USE_STATIC_REPLY=true to enable during development
const USE_STATIC_REPLY = process.env.USE_STATIC_REPLY === "true";

// Generate a static response based on the user's message
function generateStaticReply(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Simple pattern matching for common queries
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I'm currently in static reply mode for development. How can I help you today?";
  }
  
  if (lowerMessage.includes("help")) {
    return "I'm here to help! In development mode, I'm using static replies instead of making API calls to save costs. You can ask me questions, and I'll provide sample responses.";
  }
  
  if (lowerMessage.includes("what") || lowerMessage.includes("who") || lowerMessage.includes("when") || lowerMessage.includes("where")) {
    return `This is a static response to your question: "${userMessage}". In production, this would be a real AI-generated response.`;
  }
  
  // Default response
  return `[Static Reply Mode] I received your message: "${userMessage}". This is a development-only response to avoid using the OpenAI API. To enable real AI responses, set USE_STATIC_REPLY=false in your environment variables.`;
}

// Simulate streaming by chunking the response
function createStaticStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = text.split(" ");
  let index = 0;
  
  return new ReadableStream({
    async start(controller) {
      // Simulate typing delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (const chunk of chunks) {
        const content = index === 0 ? chunk : ` ${chunk}`;
        controller.enqueue(encoder.encode(content));
        await delay(30); // Small delay to simulate streaming
        index++;
      }
      controller.close();
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Static reply mode - return a static response without calling OpenAI
    if (USE_STATIC_REPLY) {
      const lastMessage = messages[messages.length - 1];
      const userMessage = lastMessage?.content || "";
      const staticReply = generateStaticReply(userMessage);
      
      console.log("[DEV MODE] Using static reply instead of OpenAI API");
      
      return new Response(createStaticStream(staticReply), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Production mode - use OpenAI API
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a streaming response
    // Try gpt-4.1-nano-2025-04-14 as specified in PRD, fallback to gpt-4o-mini if unavailable
    const preferredModel = "gpt-4.1-nano-2025-04-14";
    const fallbackModel = "gpt-4o-mini";
    
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: preferredModel,
        messages: messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        stream: true,
      });
    } catch (modelError: any) {
      // If preferred model is not available, try fallback
      if (modelError?.status === 404 || modelError?.message?.includes("model")) {
        console.warn(`Model ${preferredModel} not available, using ${fallbackModel}`);
        stream = await openai.chat.completions.create({
          model: fallbackModel,
          messages: messages.map((msg: { role: string; content: string }) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          })),
          stream: true,
        });
      } else {
        throw modelError;
      }
    }

    // Create a ReadableStream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
