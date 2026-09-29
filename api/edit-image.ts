import { GoogleGenAI } from "@google/genai";
import {
  methodAndOriginCheck,
  badRequest,
  serverError,
  isValidMimeType,
} from "./_validate";

const MODEL = "gemini-2.5-flash-image";

export async function POST(request: Request): Promise<Response> {
  const guard = methodAndOriginCheck(request);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { prompt, imageBase64, mimeType } = body as Record<string, unknown>;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return badRequest("prompt is required");
  }
  if (prompt.trim().length > 2000) {
    return badRequest("prompt must be 2000 characters or fewer");
  }
  if (typeof imageBase64 !== "string" || !imageBase64) {
    return badRequest("imageBase64 is required");
  }
  if (imageBase64.length > 7_000_000) {
    return badRequest("imageBase64 must be 7,000,000 characters or fewer");
  }
  if (!isValidMimeType(mimeType)) {
    return badRequest("mimeType must be one of: image/png, image/jpeg, image/webp");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return serverError();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt.trim() },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return Response.json({
          dataUrl: `data:image/png;base64,${part.inlineData.data}`,
        });
      }
    }
    return Response.json({ error: "No image generated" }, { status: 502 });
  } catch (error) {
    console.error("edit-image API error:", error);
    return serverError();
  }
}
