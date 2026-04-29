import { openUrl } from "@tauri-apps/plugin-opener";

export async function openExternal(url: string | null | undefined) {
  if (!url) return;

  try {
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
