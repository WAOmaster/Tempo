import { GoogleGenAI } from "@google/genai";
import { methodAndOriginCheck, badRequest, serverError } from "./_validate";

const MODEL = "gemini-3-flash-preview";

interface ProjectSummary {
  name: string;
  deadline: string;
  description: string;
  completedTasks: number;
  totalTasks: number;
  totalEstimatedMinutes: number | null;
}

export async function POST(request: Request): Promise<Response> {
  const guard = methodAndOriginCheck(request);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const { projects } = body as Record<string, unknown>;
  if (!Array.isArray(projects) || projects.length === 0) {
    return badRequest("projects array is required");
  }
  if (projects.length > 50) {
    return badRequest("Too many projects (max 50)");
  }

  // Validate and sanitise each project summary
  const summaries: ProjectSummary[] = [];
  for (const p of projects) {
    if (typeof p !== "object" || p === null) {
      return badRequest("Each project must be an object");
    }
    const proj = p as Record<string, unknown>;
    if (typeof proj.name !== "string" || !proj.name) {
      return badRequest("Each project must have a name");
    }
    summaries.push({
      name: String(proj.name).slice(0, 300),
      deadline: String(proj.deadline ?? "").slice(0, 100),
      description: String(proj.description ?? "").slice(0, 1000),
      completedTasks: Number(proj.completedTasks) || 0,
      totalTasks: Number(proj.totalTasks) || 0,
      totalEstimatedMinutes:
        typeof proj.totalEstimatedMinutes === "number"
          ? proj.totalEstimatedMinutes
          : null,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return serverError();
  }

  const projectText = summaries
    .map(
      (s) => `
      - Project: ${s.name}
      - Deadline: ${s.deadline}
      - Description: ${s.description}
      - Progress: ${s.completedTasks}/${s.totalTasks} tasks completed.
      - Estimated Remaining Work: ${s.totalEstimatedMinutes ?? "Unknown"} minutes.
    `
    )
    .join("\n");

  const prompt = `
    I am participating in the following hackathons/projects:
    ${projectText}

    Current Date: ${new Date().toISOString()}

    Please act as a Strategic Project Manager.
    Analyze the deadlines and workloads.
    Provide a "Master Strategy" on how to manage these concurrent projects.
    
    Include:
    1. A high-level schedule or timeline of focus.
    2. Identification of critical bottlenecks or conflicting deadlines.
    3. Opportunities for "Inter-Hackathon Tasks" (e.g., reusing code, combining research, prioritizing learning that applies to both).
    4. Specific advice on what to prioritize this week.

    Format the response in clean Markdown.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert technical project manager and productivity coach.",
      },
    });

    return Response.json({ strategy: response.text || "Could not generate strategy." });
  } catch (error) {
    console.error("strategy API error:", error);
    return serverError();
  }
}
