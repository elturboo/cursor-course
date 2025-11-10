// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "openai";

// Deno global is available in Edge Functions runtime
declare const Deno: typeof globalThis.Deno;

// CORS headers for cross-origin requests
// In production, replace "*" with your specific frontend domain
const getAllowedOrigin = (): string => {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");
  // For local development, allow localhost
  // In production, this should be your actual domain
  if (allowedOrigin) {
    return allowedOrigin;
  }
  // Default to localhost for local development
  return "http://localhost:3000";
};

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400", // 24 hours
});

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || getAllowedOrigin();
    const allowedOrigin = getAllowedOrigin();
    // Only allow requests from allowed origin
    const originToUse =
      origin === allowedOrigin || origin.includes("localhost")
        ? origin
        : allowedOrigin;
    return new Response("ok", { headers: corsHeaders(originToUse) });
  }
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: `Method ${req.method} not allowed` }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      if (err instanceof SyntaxError) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw err;
    }

    // Validate messages array
    const { messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const origin = req.headers.get("origin") || getAllowedOrigin();
      const allowedOrigin = getAllowedOrigin();
      const originToUse =
        origin === allowedOrigin || origin.includes("localhost")
          ? origin
          : allowedOrigin;
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders(originToUse),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate message structure and content
    const MAX_MESSAGE_LENGTH = 10000; // Limit message length
    const MAX_MESSAGES = 50; // Limit conversation history

    if (messages.length > MAX_MESSAGES) {
      const origin = req.headers.get("origin") || getAllowedOrigin();
      const allowedOrigin = getAllowedOrigin();
      const originToUse =
        origin === allowedOrigin || origin.includes("localhost")
          ? origin
          : allowedOrigin;
      return new Response(
        JSON.stringify({ error: "Too many messages in conversation" }),
        {
          status: 400,
          headers: {
            ...corsHeaders(originToUse),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        const origin = req.headers.get("origin") || getAllowedOrigin();
        const allowedOrigin = getAllowedOrigin();
        const originToUse =
          origin === allowedOrigin || origin.includes("localhost")
            ? origin
            : allowedOrigin;
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          {
            status: 400,
            headers: {
              ...corsHeaders(originToUse),
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        const origin = req.headers.get("origin") || getAllowedOrigin();
        const allowedOrigin = getAllowedOrigin();
        const originToUse =
          origin === allowedOrigin || origin.includes("localhost")
            ? origin
            : allowedOrigin;
        return new Response(
          JSON.stringify({ error: "Message content too long" }),
          {
            status: 400,
            headers: {
              ...corsHeaders(originToUse),
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Validate role
      if (!["user", "assistant", "system"].includes(msg.role)) {
        const origin = req.headers.get("origin") || getAllowedOrigin();
        const allowedOrigin = getAllowedOrigin();
        const originToUse =
          origin === allowedOrigin || origin.includes("localhost")
            ? origin
            : allowedOrigin;
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: {
            ...corsHeaders(originToUse),
            "Content-Type": "application/json",
          },
        });
      }
    }

    // Check for OpenAI API key
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Model configuration: Try gpt-5-nano, fallback to gpt-4o-mini
    const preferredModel = "gpt-5-nano";
    const fallbackModel = "gpt-4o-mini";

    // Sanitize messages before sending to OpenAI
    const sanitizedMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant" | "system",
        // Trim and limit content length
        content: String(msg.content).trim().slice(0, MAX_MESSAGE_LENGTH),
      })
    );

    // Create streaming response
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: preferredModel,
        messages: sanitizedMessages,
        stream: true,
      });
    } catch (modelError: any) {
      // If preferred model is not available, try fallback
      if (
        modelError?.status === 404 ||
        modelError?.message?.includes("model")
      ) {
        console.warn(
          `Model ${preferredModel} not available, using ${fallbackModel}`
        );
        stream = await openai.chat.completions.create({
          model: fallbackModel,
          messages: sanitizedMessages,
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

    const origin = req.headers.get("origin") || getAllowedOrigin();
    const allowedOrigin = getAllowedOrigin();
    const originToUse =
      origin === allowedOrigin || origin.includes("localhost")
        ? origin
        : allowedOrigin;

    return new Response(readableStream, {
      headers: {
        ...corsHeaders(originToUse),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error) {
    // Log full error details server-side only
    console.error("Chat API error:", error);

    // Don't expose internal error details to clients
    const origin = req.headers.get("origin") || getAllowedOrigin();
    const allowedOrigin = getAllowedOrigin();
    const originToUse =
      origin === allowedOrigin || origin.includes("localhost")
        ? origin
        : allowedOrigin;

    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        // Don't expose error details in production
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(originToUse),
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Serve functions: `npx supabase functions serve --import-map ./supabase/functions/import_map.json`
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/chat' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"messages":[{"role":"user","content":"Hello"}]}'

*/
