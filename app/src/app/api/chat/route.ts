import { NextRequest } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
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
