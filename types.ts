export interface ProjectState {
  name: string;
  deadline: Date | null;
  description: string;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  status: TaskStatus;
  phase: string;
  priority: Priority;
  completedAt?: string; // ISO string for easier storage/display
}

export interface PlanPhase {
  name: string;
  totalDurationMinutes: number;
  tasks: Task[];
  color: string;
}

export interface GeneratedPlan {
  phases: PlanPhase[];
  totalEstimatedMinutes: number;
  advice: string;
}

export interface SearchResult {
  eventName: string;
  dateISO: string;
  description: string;
  sourceUrl?: string;
}

export interface HackathonInfo {
  name: string;
  dateISO: string;
  description: string;
  url?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  deadline: string; // Stored as ISO string
  description: string;
  plan: GeneratedPlan | null;
  taskHistory: Task[];
  createdAt: string;
  updatedAt?: string; // ISO string for sync merging
  backgroundImage?: string;
}

export type ImageSize = '1K' | '2K' | '4K';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}