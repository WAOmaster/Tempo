import { GoogleGenAI } from "@google/genai";
import {
  methodAndOriginCheck,
  badRequest,
  serverError,
  isValidImageSize,
} from "./_validate";

const MODEL = "gemini-3-pro-image-preview";

export async function POST(request: Request): Promise<Response> {
  const guard = methodAndOriginCheck(request);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { prompt, size } = body as Record<string, unknown>;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return badRequest("prompt is required");
  }
  if (prompt.trim().length > 2000) {
    return badRequest("prompt must be 2000 characters or fewer");
  }
  if (!isValidImageSize(size)) {
    return badRequest("size must be one of: 1K, 2K, 4K");
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
      contents: { parts: [{ text: prompt.trim() }] },
      config: {
        imageConfig: { imageSize: size },
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
    console.error("image API error:", error);
    return serverError();
  }
}
