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

  const { projectName, projectDescription, minutesRemaining } =
    body as Record<string, unknown>;

  if (typeof projectName !== "string" || !projectName.trim()) {
    return badRequest("projectName is required");
  }
  if (typeof projectDescription !== "string" || !projectDescription.trim()) {
    return badRequest("projectDescription is required");
  }
  if (typeof minutesRemaining !== "number" || minutesRemaining <= 0) {
    return badRequest("minutesRemaining must be a positive number");
  }
  if (projectName.trim().length > 300) {
    return badRequest("projectName must be 300 characters or fewer");
  }
  if (projectDescription.trim().length > 2000) {
    return badRequest("projectDescription must be 2000 characters or fewer");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return serverError();
  }

  const hoursRemaining = (minutesRemaining / 60).toFixed(1);
  const prompt = `
    Project: ${projectName.trim()}
    Description: ${projectDescription.trim()}
    Time Remaining: ${hoursRemaining} hours.

    Create a realistic hackathon/project schedule to finish this project before the deadline.
    Divide the remaining time into logical phases (e.g., Ideation, Setup, Core Development, Polish, Submission).
    Be aggressive but realistic.
    Assign specific, actionable tasks to each phase.
    Estimate duration for each task in minutes.
    The sum of durations should roughly equal the time remaining, but leave some buffer.
    
    Also assign a PRIORITY (HIGH, MEDIUM, LOW) to each task based on how critical it is for the MVP.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  totalDurationMinutes: { type: Type.NUMBER },
                  color: {
                    type: Type.STRING,
                    description: "Hex color code for the phase (e.g. #3b82f6)",
                  },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        durationMinutes: { type: Type.NUMBER },
                        priority: {
                          type: Type.STRING,
                          enum: ["HIGH", "MEDIUM", "LOW"],
                        },
                      },
                      required: [
                        "title",
                        "description",
                        "durationMinutes",
                        "priority",
                      ],
                    },
                  },
                },
                required: ["name", "totalDurationMinutes", "tasks", "color"],
              },
            },
            totalEstimatedMinutes: { type: Type.NUMBER },
            advice: { type: Type.STRING },
          },
          required: ["phases", "totalEstimatedMinutes", "advice"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");

    // Post-process: add IDs and default status (done client-side now to avoid
    // importing browser-only enums, but we still shape the response).
    return Response.json(data);
  } catch (error) {
    console.error("plan API error:", error);
    return serverError();
  }
}
