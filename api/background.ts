import { GoogleGenAI } from "@google/genai";
import { methodAndOriginCheck, badRequest, serverError } from "./_validate";

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

  const { name, description } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    return badRequest("name is required");
  }
  if (name.trim().length > 300) {
    return badRequest("name must be 300 characters or fewer");
  }
  if (typeof description !== "string" || !description.trim()) {
    return badRequest("description is required");
  }
  if (description.trim().length > 2000) {
    return badRequest("description must be 2000 characters or fewer");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return serverError();
  }

  const prompt = `Abstract, futuristic, dark-themed wallpaper.
Context: A hackathon project named "${name.trim()}".
Details: ${description.trim()}.
Style: Cybernetic, glowing neon elements, deep space or digital grid background, minimal, high contrast.
Aesthetics: Suitable for a UI background, not too busy, dark and sleek.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: { parts: [{ text: prompt }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return Response.json({
          dataUrl: `data:image/png;base64,${part.inlineData.data}`,
        });
      }
    }
    return Response.json({ error: "No background image generated" }, { status: 502 });
  } catch (error) {
    console.error("background API error:", error);
    return serverError();
  }
}
