// Minimal i18n helper for the Chinese fork.
// UI strings live in `messages/zh-CN.json`; `t(key, fallback)` returns the
// translated string, falling back to `fallback` (or the key) when absent.
// Model-facing prompts are NOT part of this catalog (separate files, unchanged).
import zhCN from "@/messages/zh-CN.json";

const MESSAGES = zhCN as Record<string, string>;

export type Locale = "zh-CN";
export const LOCALE: Locale = "zh-CN";

export function t(key: string, fallback?: string): string {
  return MESSAGES[key] ?? fallback ?? key;
}
