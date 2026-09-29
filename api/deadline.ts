import { GoogleGenAI, Type } from "@google/genai";
import { methodAndOriginCheck, badRequest, serverError } from "./_validate";

const MODEL = "gemini-3-flash-preview";

export async function POST(request: Request): Promise<Response> {
  const guard = methodAndOriginCheck(request);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { query } = body as Record<string, unknown>;
  if (typeof query !== "string" || !query.trim()) {
    return badRequest("query is required");
  }
  const trimmed = query.trim();
  if (trimmed.length > 300) {
    return badRequest("query must be 300 characters or fewer");
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
      contents: `Find the submission deadline for: ${trimmed}`,
      config: {
        systemInstruction: `You are an event deadline extraction assistant.
Your goal is to find the submission deadline for the event specified by the user.
Use Google Search to find the most accurate and recent date.
Return the date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss).
If a time is not specified, assume 23:59:59 local time of the event location or UTC if unknown.`,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING },
            dateISO: {
              type: Type.STRING,
              description: "ISO 8601 format date string",
            },
            description: { type: Type.STRING },
            sourceUrl: { type: Type.STRING },
          },
          required: ["eventName", "dateISO", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return Response.json({ error: "No result found" }, { status: 502 });
    }

    const data = JSON.parse(text);

    // Extract source URL from grounding metadata if not in JSON
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let sourceUrl = data.sourceUrl;
    if (!sourceUrl && groundingChunks && groundingChunks.length > 0) {
      const webChunk = groundingChunks.find((c: any) => c.web?.uri);
      if (webChunk) sourceUrl = webChunk.web.uri;
    }

    return Response.json({
      eventName: data.eventName,
      dateISO: data.dateISO,
      description: data.description,
      sourceUrl,
    });
  } catch (error) {
    console.error("deadline API error:", error);
    return serverError();
  }
}
