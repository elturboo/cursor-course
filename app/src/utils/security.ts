/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes potentially dangerous characters and HTML tags
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove HTML tags
  const withoutHtml = input.replace(/<[^>]*>/g, "");
  
  // Remove script tags and event handlers
  const withoutScripts = withoutHtml
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  return withoutScripts.trim();
}

/**
 * Validates message content length
 */
export function validateMessageLength(content: string, maxLength: number = 10000): boolean {
  return typeof content === "string" && content.length <= maxLength;
}

/**
 * Validates prompt length for image generation
 */
export function validatePromptLength(prompt: string, maxLength: number = 1000): boolean {
  return typeof prompt === "string" && prompt.length <= maxLength && prompt.trim().length > 0;
}

/**
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

