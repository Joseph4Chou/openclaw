import type { ToolProfileId } from "../config/types.tools.js";

export const PRODUCT_PROFILE_ENV = "OPENCLAW_PRODUCT_PROFILE";

export type ProductProfile = "default" | "local-solo";

const LOCAL_SOLO_PROFILE_ALIASES = new Set(["local-solo", "localsolo", "solo", "single-user"]);

const LOCAL_SOLO_BUNDLED_PLUGIN_IDS = new Set([
  "document-extract",
  "file-transfer",
  "memory-core",
  "ollama",
  "openai",
  "web-readability",
]);

export const LOCAL_SOLO_TOOLS_PROFILE: ToolProfileId = "minimal";

export const LOCAL_SOLO_TOOLS_ALSO_ALLOW = ["message", "read"] as const;

export const LOCAL_SOLO_TOOLS_DENY = [
  "exec",
  "process",
  "browser",
  "nodes",
  "cron",
  "gateway",
  "agents_list",
  "sessions_spawn",
  "sessions_yield",
  "subagents",
] as const;

function normalizeProfile(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function resolveProductProfile(env: NodeJS.ProcessEnv = process.env): ProductProfile {
  return LOCAL_SOLO_PROFILE_ALIASES.has(normalizeProfile(env[PRODUCT_PROFILE_ENV]))
    ? "local-solo"
    : "default";
}

export function isLocalSoloProductProfile(env: NodeJS.ProcessEnv = process.env): boolean {
  return resolveProductProfile(env) === "local-solo";
}

export function isBundledPluginEnabledForProductProfile(
  pluginId: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!isLocalSoloProductProfile(env)) {
    return true;
  }
  return LOCAL_SOLO_BUNDLED_PLUGIN_IDS.has(pluginId);
}
