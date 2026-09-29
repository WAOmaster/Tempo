import { GoogleGenAI, Type } from "@google/genai";
import { methodAndOriginCheck, badRequest, serverError } from "./_validate";

const MODEL = "gemini-3-flash-preview";

export async function POST(request: Request): Promise<Response> {
  const guard = methodAndOriginCheck(request);
  if (guard) return guard;

  // No body needed — fetches are parameter-free
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return serverError();
  }

  const prompt = `Find 5 popular upcoming hackathons or developer competitions happening in the next 6 months globally.
Return their names, submission deadlines (or end dates) in ISO format, and brief descriptions.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dateISO: { type: Type.STRING },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ["name", "dateISO", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return Response.json([]);

    return Response.json(JSON.parse(text));
  } catch (error) {
    console.error("hackathons API error:", error);
    return serverError();
  }
}
