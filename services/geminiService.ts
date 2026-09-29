/**
 * Gemini service – thin client that delegates to /api/* serverless functions.
 * No API keys, models or prompts are present in this file.
 */

import {
  GeneratedPlan,
  SearchResult,
  TaskStatus,
  Priority,
  ImageSize,
  HackathonInfo,
  SavedProject,
} from "../types";

// ── helpers ──────────────────────────────────────────────────────────

async function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error((msg as Record<string, string>).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── public API (signatures unchanged) ────────────────────────────────

export const findEventDeadline = async (query: string): Promise<SearchResult> => {
  return post<SearchResult>("/api/deadline", { query });
};

export const getUpcomingHackathons = async (): Promise<HackathonInfo[]> => {
  return post<HackathonInfo[]>("/api/hackathons", {});
};

export const generateMasterStrategy = async (
  projects: SavedProject[]
): Promise<string> => {
  // Send only the data the server needs — avoid leaking full local state
  const summaries = projects.map((p) => ({
    name: p.name,
    deadline: p.deadline,
    description: p.description,
    completedTasks: p.taskHistory.length,
    totalTasks:
      p.plan?.phases.reduce((acc, phase) => acc + phase.tasks.length, 0) || 0,
    totalEstimatedMinutes: p.plan?.totalEstimatedMinutes ?? null,
  }));

  const data = await post<{ strategy: string }>("/api/strategy", {
    projects: summaries,
  });
  return data.strategy;
};

export const generateProjectPlan = async (
  projectName: string,
  projectDescription: string,
  minutesRemaining: number
): Promise<GeneratedPlan> => {
  const data = await post<GeneratedPlan>("/api/plan", {
    projectName,
    projectDescription,
    minutesRemaining,
  });

  // Post-process: add IDs and status (same as original)
  const processedPhases = data.phases.map((phase) => ({
    ...phase,
    tasks: phase.tasks.map((task) => ({
      ...task,
      id: crypto.randomUUID(),
      status: TaskStatus.TODO,
      phase: phase.name,
      priority: task.priority || Priority.MEDIUM,
    })),
  }));

  return { ...data, phases: processedPhases };
};

export const generateImage = async (
  prompt: string,
  size: ImageSize
): Promise<string> => {
  const data = await post<{ dataUrl: string }>("/api/image", { prompt, size });
  return data.dataUrl;
};

export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  // Strip data URL prefix if present (same as original)
  const imageBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const data = await post<{ dataUrl: string }>("/api/edit-image", {
    prompt,
    imageBase64,
    mimeType,
  });
  return data.dataUrl;
};

export const generateProjectBackground = async (
  name: string,
  description: string
): Promise<string> => {
  const data = await post<{ dataUrl: string }>("/api/background", {
    name,
    description,
  });
  return data.dataUrl;
};