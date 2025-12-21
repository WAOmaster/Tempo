import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPlan, SearchResult, TaskStatus, Priority, ImageSize, HackathonInfo, SavedProject } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Models
const SEARCH_MODEL = 'gemini-3-flash-preview'; // Good for tool use
const PLANNER_MODEL = 'gemini-3-flash-preview'; // Good for structured JSON
const IMAGE_GEN_MODEL = 'gemini-3-pro-image-preview';
const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image';
const BACKGROUND_GEN_MODEL = 'gemini-2.5-flash-image'; // Nano banana for fast background generation

/**
 * Searches for an event deadline using Google Search Tool.
 */
export const findEventDeadline = async (query: string): Promise<SearchResult> => {
  if (!API_KEY) throw new Error("API Key not found");

  const systemInstruction = `You are an event deadline extraction assistant. 
  Your goal is to find the submission deadline for the event specified by the user.
  Use Google Search to find the most accurate and recent date. 
  Return the date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss).
  If a time is not specified, assume 23:59:59 local time of the event location or UTC if unknown.`;

  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: `Find the submission deadline for: ${query}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING },
            dateISO: { type: Type.STRING, description: "ISO 8601 format date string" },
            description: { type: Type.STRING },
            sourceUrl: { type: Type.STRING }
          },
          required: ["eventName", "dateISO", "description"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // In case the model returns grounding metadata but the text is raw JSON
    const data = JSON.parse(text);
    
    // Extract source URL from grounding if available and not already in JSON
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let sourceUrl = data.sourceUrl;
    
    if (!sourceUrl && groundingChunks && groundingChunks.length > 0) {
       // Try to find a valid URL from chunks
       const webChunk = groundingChunks.find((c: any) => c.web?.uri);
       if (webChunk) {
         sourceUrl = webChunk.web.uri;
       }
    }

    return {
      eventName: data.eventName,
      dateISO: data.dateISO,
      description: data.description,
      sourceUrl
    };

  } catch (error) {
    console.error("Error finding event:", error);
    throw error;
  }
};

/**
 * Fetches a list of upcoming hackathons.
 */
export const getUpcomingHackathons = async (): Promise<HackathonInfo[]> => {
  if (!API_KEY) throw new Error("API Key not found");

  const prompt = `Find 5 popular upcoming hackathons or developer competitions happening in the next 6 months globally. 
  Return their names, submission deadlines (or end dates) in ISO format, and brief descriptions.`;

  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
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
              url: { type: Type.STRING }
            },
            required: ["name", "dateISO", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching hackathons:", error);
    return [];
  }
};

/**
 * Generates a master strategy for managing multiple projects.
 */
export const generateMasterStrategy = async (projects: SavedProject[]): Promise<string> => {
  if (!API_KEY) throw new Error("API Key not found");
  
  const projectSummaries = projects.map(p => {
    const totalTasks = p.plan?.phases.reduce((acc, phase) => acc + phase.tasks.length, 0) || 0;
    const completedTasks = p.taskHistory.length;
    return `
      - Project: ${p.name}
      - Deadline: ${p.deadline}
      - Description: ${p.description}
      - Progress: ${completedTasks}/${totalTasks} tasks completed.
      - Estimated Remaining Work: ${p.plan?.totalEstimatedMinutes || 'Unknown'} minutes.
    `;
  }).join('\n');

  const prompt = `
    I am participating in the following hackathons/projects:
    ${projectSummaries}

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
    const response = await ai.models.generateContent({
      model: PLANNER_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert technical project manager and productivity coach.",
      }
    });

    return response.text || "Could not generate strategy.";
  } catch (error) {
    console.error("Error generating master strategy:", error);
    throw error;
  }
};

/**
 * Generates a project plan based on remaining time and description.
 */
export const generateProjectPlan = async (
  projectName: string, 
  projectDescription: string, 
  minutesRemaining: number
): Promise<GeneratedPlan> => {
  if (!API_KEY) throw new Error("API Key not found");

  const hoursRemaining = (minutesRemaining / 60).toFixed(1);

  const prompt = `
    Project: ${projectName}
    Description: ${projectDescription}
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
    const response = await ai.models.generateContent({
      model: PLANNER_MODEL,
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
                  color: { type: Type.STRING, description: "Hex color code for the phase (e.g. #3b82f6)" },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        durationMinutes: { type: Type.NUMBER },
                        priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] }
                      },
                      required: ["title", "description", "durationMinutes", "priority"]
                    }
                  }
                },
                required: ["name", "totalDurationMinutes", "tasks", "color"]
              }
            },
            totalEstimatedMinutes: { type: Type.NUMBER },
            advice: { type: Type.STRING }
          },
          required: ["phases", "totalEstimatedMinutes", "advice"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Post-process to add IDs and status
    const processedPhases = data.phases.map((phase: any) => ({
      ...phase,
      tasks: phase.tasks.map((task: any) => ({
        ...task,
        id: crypto.randomUUID(),
        status: TaskStatus.TODO,
        phase: phase.name,
        priority: task.priority || Priority.MEDIUM
      }))
    }));

    return {
      ...data,
      phases: processedPhases
    };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};

/**
 * Generates an image using Gemini 3 Pro Image Preview.
 */
export const generateImage = async (prompt: string, size: ImageSize): Promise<string> => {
  // Always create a new instance to ensure the latest API key is used
  const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await aiClient.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Edits an image using Gemini 2.5 Flash Image.
 */
export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Strip data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await aiClient.models.generateContent({
      model: IMAGE_EDIT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated from edit");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Generates a thematic background for a project using Nano Banana (Gemini 2.5 Flash Image).
 */
export const generateProjectBackground = async (name: string, description: string): Promise<string> => {
  const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Abstract, futuristic, dark-themed wallpaper.
  Context: A hackathon project named "${name}".
  Details: ${description}.
  Style: Cybernetic, glowing neon elements, deep space or digital grid background, minimal, high contrast.
  Aesthetics: Suitable for a UI background, not too busy, dark and sleek.`;

  try {
    const response = await aiClient.models.generateContent({
      model: BACKGROUND_GEN_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      // Nano banana generally implies gemini-2.5-flash-image which supports standard generateContent for images.
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No background image generated");
  } catch (error) {
    console.error("Error generating background:", error);
    throw error;
  }
};