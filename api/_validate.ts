/**
 * Shared validation and origin-checking helpers for all API routes.
 * Not an endpoint — underscore-prefixed so Vercel ignores it.
 */

const ALLOWED_ORIGINS = [
  "https://tempo.appcloudpro.com",
];

// ponytail: Origin only stops other websites' browsers; scripts can forge it. The real spend cap is the
// daily quota on the Gemini key in Google Cloud — set one whenever the key is replaced.
function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https:\/\/tempo-[\w-]+\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

export function methodAndOriginCheck(request: Request): Response | null {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const origin = request.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(): Response {
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

const VALID_IMAGE_SIZES = ["1K", "2K", "4K"];

export function isValidImageSize(s: unknown): s is string {
  return typeof s === "string" && VALID_IMAGE_SIZES.includes(s);
}

const VALID_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function isValidMimeType(s: unknown): s is string {
  return typeof s === "string" && VALID_MIME_TYPES.includes(s);
}
