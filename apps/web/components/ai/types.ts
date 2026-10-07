import type { AITool } from "@pixelforge/shared";

/** Client mirror of `serializeJob` (lib/ai/jobs.ts). */
export interface JobAsset {
  id: string;
  url: string;
  previewUrl: string | null;
  thumbUrl: string | null;
  width: number | null;
  height: number | null;
  mimeType: string;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "blocked";

export interface AIJobView {
  id: string;
  tool: AITool;
  status: JobStatus;
  input: Record<string, unknown>;
  costCredits: number;
  error: string | null;
  texts: string[];
  assets: JobAsset[];
  source: JobAsset | null;
  favorite: boolean;
  createdAt: string;
  finishedAt: string | null;
}

export interface HistoryItem {
  id: string;
  tool: AITool;
  status: JobStatus;
  summary: string;
  costCredits: number;
  favorite: boolean;
  thumbUrl: string | null;
  createdAt: string;
}

export const isTerminal = (s: JobStatus) => s === "succeeded" || s === "failed" || s === "blocked";
