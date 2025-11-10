// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "openai";

// Deno global is available in Edge Functions runtime
declare const Deno: typeof globalThis.Deno;

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Validate prompt
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Prompt is required and must be a non-empty string",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    // Generate image using gpt-image-1 model
    try {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt.trim(),
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = result.data[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL returned from OpenAI");
      }

      return new Response(
        JSON.stringify({
          imageUrl,
          prompt: prompt.trim(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (imageError: any) {
      console.error("Image generation error:", imageError);

      // If gpt-image-1 is not available, try fallback to dall-e-3
      if (
        imageError?.status === 404 ||
        imageError?.message?.includes("model") ||
        imageError?.message?.includes("gpt-image-1")
      ) {
        console.warn("gpt-image-1 not available, trying dall-e-3");
        try {
          const fallbackResult = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt.trim(),
            n: 1,
            size: "1024x1024",
          });

          const imageUrl = fallbackResult.data[0]?.url;
          if (!imageUrl) {
            throw new Error("No image URL returned from OpenAI");
          }

          return new Response(
            JSON.stringify({
              imageUrl,
              prompt: prompt.trim(),
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (fallbackError) {
          throw fallbackError;
        }
      } else {
        throw imageError;
      }
    }
  } catch (error) {
    console.error("Generate image API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-image' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"prompt":"A beautiful sunset over the ocean"}'

*/
