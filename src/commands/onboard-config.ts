import { setConfigValueAtPath } from "../config/config-paths.js";
import type { DmScope } from "../config/types.base.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { ToolProfileId } from "../config/types.tools.js";
import {
  isLocalSoloProductProfile,
  LOCAL_SOLO_TOOLS_ALSO_ALLOW,
  LOCAL_SOLO_TOOLS_DENY,
  LOCAL_SOLO_TOOLS_PROFILE,
} from "../shared/product-profile.js";

export const ONBOARDING_DEFAULT_DM_SCOPE: DmScope = "per-channel-peer";
export const ONBOARDING_DEFAULT_TOOLS_PROFILE: ToolProfileId = "coding";

function mergeUniqueStrings(
  existing: readonly string[] | undefined,
  additions: readonly string[],
): string[] {
  return [...new Set([...(existing ?? []), ...additions])];
}

export function applyLocalSetupWorkspaceConfig(
  baseConfig: OpenClawConfig,
  workspaceDir: string,
  env: NodeJS.ProcessEnv = process.env,
): OpenClawConfig {
  const tools = {
    ...baseConfig.tools,
    profile: baseConfig.tools?.profile ?? ONBOARDING_DEFAULT_TOOLS_PROFILE,
  };

  if (isLocalSoloProductProfile(env)) {
    tools.profile = LOCAL_SOLO_TOOLS_PROFILE;
    tools.alsoAllow = mergeUniqueStrings(tools.alsoAllow, LOCAL_SOLO_TOOLS_ALSO_ALLOW);
    tools.deny = mergeUniqueStrings(tools.deny, LOCAL_SOLO_TOOLS_DENY);
  }

  return {
    ...baseConfig,
    agents: {
      ...baseConfig.agents,
      defaults: {
        ...baseConfig.agents?.defaults,
        workspace: workspaceDir,
      },
    },
    gateway: {
      ...baseConfig.gateway,
      mode: "local",
    },
    session: {
      ...baseConfig.session,
      dmScope: baseConfig.session?.dmScope ?? ONBOARDING_DEFAULT_DM_SCOPE,
    },
    tools: {
      ...tools,
    },
  };
}

export function applySkipBootstrapConfig(cfg: OpenClawConfig): OpenClawConfig {
  const next = structuredClone(cfg);
  setConfigValueAtPath(
    next as Record<string, unknown>,
    ["agents", "defaults", "skipBootstrap"],
    true,
  );
  return next;
}
