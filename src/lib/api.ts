import { fetch } from "@tauri-apps/plugin-http";
import { apiCache, invalidateUser } from "./cache";

export const API_BASE = "https://flavortown.hackclub.com/api/v1";
export const API_KEY_STORAGE = "ft_api_key";

/* EN: Helper utilities for API calls. | FR: Utilitaires d'assistance pour les appels API. */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  retries = 3,
  backoff = 1000,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(input, init);
    if (res.status === 429) {
      if (attempt < retries) {
        await sleep(backoff * Math.pow(2, attempt));
        continue;
      }
      throw new Error("429");
    }
    return res;
  }
  throw new Error("429");
}

/* EN: Shared API types. | FR: Types API partagés. */

export interface User {
  id: number;
  slack_id: string;
  display_name: string;
  avatar: string;
  project_ids: number[];
  cookies: number | null;
  vote_count: number;
  like_count: number;
  devlog_seconds_total: number;
  devlog_seconds_today: number;
}

export interface Devlog {
  id: number;
  body: string;
  comments_count: number;
  duration_seconds: number;
  likes_count: number;
  scrapbook_url: string;
  created_at: string;
  updated_at: string;
  media: Array<{ url: string; content_type: string }>;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  repo_url: string | null;
  demo_url: string | null;
  readme_url: string | null;
  ai_declaration: string | null;
  ship_status: string;
  devlog_ids: number[];
  banner_url: string | null;
  created_at: string;
  updated_at: string;
}

/* EN: Low-level HTTP client helpers. | FR: Utilitaires du client HTTP bas niveau. */

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetchWithRetry(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/* EN: API endpoint wrappers. | FR: Enveloppes des points d'entrée API. */

export async function getMe(apiKey: string): Promise<User> {
  const key = `me:${apiKey}`;
  const cached = apiCache.read<User>(key);
  if (cached) return cached;

  const data = await apiFetch<User>("/users/me", apiKey);
  apiCache.write(key, data);
  return data;
}

export async function getProjectDevlogs(
  projectId: number,
  apiKey: string,
): Promise<Devlog[]> {
  const key = `devlogs:${apiKey}:${projectId}`;
  const cached = apiCache.read<Devlog[]>(key);
  if (cached) return cached;

  const data = await apiFetch<{ devlogs: Devlog[] }>(
    `/projects/${projectId}/devlogs`,
    apiKey,
  );
  const devlogs = data.devlogs ?? [];
  apiCache.write(key, devlogs);
  return devlogs;
}

export async function getAllUserDevlogs(
  apiKey: string,
  projectIds: number[],
): Promise<Devlog[]> {
  if (projectIds.length === 0) return [];
  const chunks: Devlog[][] = [];
  for (const id of projectIds) {
    chunks.push(await getProjectDevlogs(id, apiKey));
    await sleep(200);
  }
  return chunks
    .flat()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
}

export async function getUserProjects(
  apiKey: string,
  projectIds: number[],
): Promise<Project[]> {
  if (projectIds.length === 0) return [];
  const projects: Project[] = [];
  for (const id of projectIds) {
    const key = `project:${apiKey}:${id}`;
    const cached = apiCache.read<Project>(key);
    if (cached) {
      projects.push(cached);
    } else {
      const data = await apiFetch<Project>(`/projects/${id}`, apiKey);
      apiCache.write(key, data);
      projects.push(data);
      await sleep(200);
    }
  }
  return projects;
}

export { invalidateUser };

/* EN: Formatting helpers for UI output. | FR: Utilitaires de formatage pour l'affichage. */

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/* EN: Helpers for cumulative chart data. | FR: Utilitaires pour les données du graphique cumulatif. */

export interface ChartPoint {
  date: string;
  minutes: number; // EN: Cumulative value. | FR: Valeur cumulative.
}

export function buildCumulativeChart(devlogs: Devlog[]): ChartPoint[] {
  if (devlogs.length === 0) return [];
  const byDate: Record<string, number> = {};
  for (const d of devlogs) {
    const day = d.created_at.slice(0, 10);
    byDate[day] = (byDate[day] ?? 0) + d.duration_seconds;
  }
  let cum = 0;
  return Object.keys(byDate)
    .sort()
    .map((day) => {
      cum += byDate[day];
      return {
        date: fmtDate(day + "T00:00:00"),
        minutes: Math.round(cum / 60),
      };
    });
}

/* EN: Helpers for activity heatmap data. | FR: Utilitaires pour les données de la heatmap d'activité. */

export interface HeatmapCell {
  date: string; // EN: ISO date in YYYY-MM-DD format. | FR: Date ISO au format YYYY-MM-DD.
  count: number;
}

export function buildHeatmap(devlogs: Devlog[], weeks = 14): HeatmapCell[] {
  const byDate: Record<string, number> = {};
  for (const d of devlogs) {
    const day = d.created_at.slice(0, 10);
    byDate[day] = (byDate[day] ?? 0) + 1;
  }
  const now = new Date();
  // EN: Align the range start to Monday. | FR: Aligne le début de la plage sur le lundi.
  const dayOfWeek = now.getDay();
  const daysBack = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weeks - 1) * 7;
  const start = new Date(now);
  start.setDate(now.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);

  const cells: HeatmapCell[] = [];
  const cursor = new Date(start);
  while (cursor <= now) {
    const iso = cursor.toISOString().slice(0, 10);
    cells.push({ date: iso, count: byDate[iso] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}
