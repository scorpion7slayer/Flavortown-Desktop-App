import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  apiCache,
  cacheScope,
  invalidateLegacyUserCache,
  invalidateUser,
} from "./cache";

export const API_BASE = "https://flavortown.hackclub.com/api/v1";
export const FLAVORTOWN_ORIGIN = "https://flavortown.hackclub.com";
const DEV_BROWSER_API_BASE = "/api/v1";
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
    const res = await httpFetch(input, init);
    if (res.status === 429) {
      if (attempt < retries) {
        const retryAfter = Number(res.headers.get("Retry-After"));
        const waitMs = Number.isFinite(retryAfter)
          ? retryAfter * 1000
          : backoff * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }
      throw new Error("429");
    }
    return res;
  }
  throw new Error("429");
}

async function httpFetch(input: string, init?: RequestInit): Promise<Response> {
  if (isTauri()) {
    return tauriFetch(input, init);
  }
  return globalThis.fetch(input, init);
}

function apiBase(): string {
  return isTauri() ? API_BASE : DEV_BROWSER_API_BASE;
}

export function absoluteFlavortownUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;

  try {
    return new URL(url, FLAVORTOWN_ORIGIN).toString();
  } catch {
    return url;
  }
}

/* EN: Shared API types. | FR: Types API partagés. */

export interface Pagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
}

export interface Achievement {
  slug: string;
  name: string;
  description: string;
}

export interface Comment {
  id: number;
  author: {
    id: number;
    display_name: string;
    avatar: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  slack_id: string;
  display_name: string;
  avatar: string;
  project_ids: number[];
  cookies: number | null;
}

export interface UserDetail extends User {
  vote_count: number;
  like_count: number;
  devlog_seconds_total: number;
  devlog_seconds_today: number;
  achievements?: Achievement[];
}

export interface Devlog {
  id: number;
  body: string;
  author?: {
    id: number;
    display_name: string;
    avatar: string;
  };
  project?: {
    id: number;
    title: string;
    banner_url?: string | null;
  };
  comments_count: number;
  duration_seconds: number;
  likes_count: number;
  scrapbook_url: string;
  created_at: string;
  updated_at: string;
  media?: Array<{ url: string; content_type: string }>;
  comments?: Comment[];
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

export interface RegionEnabled {
  enabled_au: boolean;
  enabled_ca: boolean;
  enabled_eu: boolean;
  enabled_in: boolean;
  enabled_uk: boolean;
  enabled_us: boolean;
  enabled_xx: boolean;
}

export interface TicketCost {
  base_cost: number;
  au: number;
  ca: number;
  eu: number;
  in: number;
  uk: number;
  us: number;
  xx: number;
}

export interface StoreItem {
  id: number;
  name: string;
  description: string;
  old_prices: unknown[];
  limited: boolean;
  stock: number;
  type: string;
  show_in_carousel: boolean;
  accessory_tag: string;
  agh_contents: string;
  attached_shop_item_ids: unknown[];
  buyable_by_self: boolean;
  long_description: string;
  max_qty: number;
  one_per_person_ever: boolean;
  sale_percentage: number;
  image_url: string;
  enabled: RegionEnabled;
  ticket_cost: TicketCost;
}

export interface ProjectList {
  projects: Project[];
  pagination: Pagination;
}

export interface UserList {
  users: User[];
  pagination: Pagination;
}

export interface DevlogList {
  devlogs: Devlog[];
  pagination: Pagination;
}

interface ListOptions {
  page?: number;
  limit?: number;
  query?: string;
}

/* EN: Low-level HTTP client helpers. | FR: Utilitaires du client HTTP bas niveau. */

function queryString(options: ListOptions): string {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  if (options.query?.trim()) params.set("query", options.query.trim());
  const query = params.toString();
  return query ? `?${query}` : "";
}

function scopedCacheKey(apiKey: string, key: string): string {
  return `${cacheScope(apiKey)}:${key}`;
}

async function apiFetch<T>(
  path: string,
  apiKey: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  const res = await fetchWithRetry(`${apiBase()}${path}`, {
    ...init,
    headers,
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function getAllPages<T, TResponse>(
  apiKey: string,
  cacheKey: string,
  pathForPage: (page: number) => string,
  pick: (response: TResponse) => { items: T[]; pagination?: Pagination },
): Promise<T[]> {
  const cached = apiCache.read<T[]>(cacheKey);
  if (cached) return cached;

  const items: T[] = [];
  let page = 1;

  for (;;) {
    const response = await apiFetch<TResponse>(pathForPage(page), apiKey);
    const { items: pageItems, pagination } = pick(response);
    items.push(...pageItems);

    if (!pagination?.next_page) break;
    page = pagination.next_page;
    await sleep(250);
  }

  apiCache.write(cacheKey, items);
  return items;
}

/* EN: API endpoint wrappers. | FR: Enveloppes des points d'entrée API. */

export async function getMe(apiKey: string): Promise<UserDetail> {
  invalidateLegacyUserCache(apiKey);
  const key = scopedCacheKey(apiKey, "me");
  const cached = apiCache.read<UserDetail>(key);
  if (cached) return cached;

  const data = await apiFetch<UserDetail>("/users/me", apiKey);
  apiCache.write(key, data);
  return data;
}

export async function getProjectDevlogs(
  projectId: number,
  apiKey: string,
): Promise<Devlog[]> {
  const key = scopedCacheKey(apiKey, `devlogs:${projectId}`);
  return getAllPages<Devlog, DevlogList>(
    apiKey,
    key,
    (page) =>
      `/projects/${projectId}/devlogs${queryString({ page, limit: 100 })}`,
    (response) => ({
      items: response.devlogs ?? [],
      pagination: response.pagination,
    }),
  );
}

export async function getProject(
  projectId: number,
  apiKey: string,
): Promise<Project> {
  const key = scopedCacheKey(apiKey, `project:${projectId}`);
  const cached = apiCache.read<Project>(key);
  if (cached) return cached;

  const data = await apiFetch<Project>(`/projects/${projectId}`, apiKey);
  apiCache.write(key, data);
  return data;
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
    const key = scopedCacheKey(apiKey, `project:${id}`);
    const cached = apiCache.read<Project>(key);
    if (cached) {
      projects.push(cached);
    } else {
      projects.push(await getProject(id, apiKey));
      await sleep(200);
    }
  }
  return projects;
}

export async function getMyProjects(apiKey: string): Promise<Project[]> {
  const key = scopedCacheKey(apiKey, "projects:me");
  const cached = apiCache.read<Project[]>(key);
  if (cached) return cached;

  const [user, listedProjects] = await Promise.all([
    getMe(apiKey),
    getAllPages<Project, ProjectList>(
      apiKey,
      `${key}:listed`,
      (page) => `/users/me/projects${queryString({ page, limit: 100 })}`,
      (response) => ({
        items: response.projects ?? [],
        pagination: response.pagination,
      }),
    ),
  ]);

  const byId = new Map<number, Project>();
  for (const project of listedProjects) {
    byId.set(project.id, project);
  }

  for (const projectId of user.project_ids) {
    if (!byId.has(projectId)) {
      byId.set(projectId, await getProject(projectId, apiKey));
      await sleep(200);
    }
  }

  const projects = [...byId.values()];
  const hydrated: Project[] = [];
  for (const project of projects) {
    if (project.banner_url) {
      hydrated.push(project);
    } else {
      hydrated.push(await getProject(project.id, apiKey));
      await sleep(200);
    }
  }

  const ordered = hydrated.sort((a, b) => a.id - b.id);

  apiCache.write(key, ordered);
  return ordered;
}

export async function listProjects(
  apiKey: string,
  options: ListOptions = {},
): Promise<ProjectList> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 24, 100);
  const query = options.query?.trim() ?? "";
  const key = scopedCacheKey(apiKey, `projects:list:${page}:${limit}:${query}`);
  const cached = apiCache.read<ProjectList>(key);
  if (cached) return cached;

  const data = await apiFetch<ProjectList>(
    `/projects${queryString({ page, limit, query })}`,
    apiKey,
  );
  apiCache.write(key, data);
  return data;
}

export async function listUsers(
  apiKey: string,
  options: ListOptions = {},
): Promise<UserList> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 50, 100);
  const query = options.query?.trim() ?? "";
  const key = scopedCacheKey(apiKey, `users:list:${page}:${limit}:${query}`);
  const cached = apiCache.read<UserList>(key);
  if (cached) return cached;

  const data = await apiFetch<UserList>(
    `/users${queryString({ page, limit, query })}`,
    apiKey,
  );
  apiCache.write(key, data);
  return data;
}

export async function listDevlogs(
  apiKey: string,
  options: ListOptions = {},
): Promise<DevlogList> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const key = scopedCacheKey(apiKey, `devlogs:list:${page}:${limit}`);
  const cached = apiCache.read<DevlogList>(key);
  if (cached) return cached;

  const data = await apiFetch<DevlogList>(
    `/devlogs${queryString({ page, limit })}`,
    apiKey,
  );
  apiCache.write(key, data);
  return data;
}

export async function listStoreItems(apiKey: string): Promise<StoreItem[]> {
  const key = scopedCacheKey(apiKey, "store:list");
  const cached = apiCache.read<StoreItem[]>(key);
  if (cached) return cached;

  const data = await apiFetch<StoreItem[]>("/store", apiKey);
  apiCache.write(key, data);
  return data;
}

export function invalidateApiLists(apiKey: string): void {
  const scope = cacheScope(apiKey);
  apiCache.invalidate(`${scope}:projects:list:`);
  apiCache.invalidate(`${scope}:projects:me`);
  apiCache.invalidate(`${scope}:users:list:`);
  apiCache.invalidate(`${scope}:devlogs:list:`);
  apiCache.invalidate(`${scope}:store:list`);

  apiCache.invalidate(`projects:list:${apiKey}:`);
  apiCache.invalidate(`projects:me:${apiKey}`);
  apiCache.invalidate(`projects:me:${apiKey}:listed`);
  apiCache.invalidate(`users:list:${apiKey}:`);
  apiCache.invalidate(`devlogs:list:${apiKey}:`);
  apiCache.invalidate(`store:list:${apiKey}`);
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
