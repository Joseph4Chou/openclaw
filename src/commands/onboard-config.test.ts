import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  applyLocalSetupWorkspaceConfig,
  ONBOARDING_DEFAULT_DM_SCOPE,
  ONBOARDING_DEFAULT_TOOLS_PROFILE,
} from "./onboard-config.js";

describe("applyLocalSetupWorkspaceConfig", () => {
  it("defaults local setup tool profile to coding", () => {
    expect(ONBOARDING_DEFAULT_TOOLS_PROFILE).toBe("coding");
  });

  it("sets secure dmScope default when unset", () => {
    const baseConfig: OpenClawConfig = {};
    const result = applyLocalSetupWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.session?.dmScope).toBe(ONBOARDING_DEFAULT_DM_SCOPE);
    expect(result.gateway?.mode).toBe("local");
    expect(result.agents?.defaults?.workspace).toBe("/tmp/workspace");
    expect(result.tools?.profile).toBe(ONBOARDING_DEFAULT_TOOLS_PROFILE);
  });

  it("preserves existing dmScope when already configured", () => {
    const baseConfig: OpenClawConfig = {
      session: {
        dmScope: "main",
      },
    };
    const result = applyLocalSetupWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.session?.dmScope).toBe("main");
  });

  it("preserves explicit non-main dmScope values", () => {
    const baseConfig: OpenClawConfig = {
      session: {
        dmScope: "per-account-channel-peer",
      },
    };
    const result = applyLocalSetupWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.session?.dmScope).toBe("per-account-channel-peer");
  });

  it("preserves an explicit tools.profile when already configured", () => {
    const baseConfig: OpenClawConfig = {
      tools: {
        profile: "full",
      },
    };
    const result = applyLocalSetupWorkspaceConfig(baseConfig, "/tmp/workspace");

    expect(result.tools?.profile).toBe("full");
  });

  it("applies the local-solo tool policy when the product profile is enabled", () => {
    const baseConfig: OpenClawConfig = {
      tools: {
        alsoAllow: ["existing_tool"],
        deny: ["existing_deny"],
        profile: "full",
      },
    };

    const result = applyLocalSetupWorkspaceConfig(baseConfig, "/tmp/workspace", {
      OPENCLAW_PRODUCT_PROFILE: "local-solo",
    });

    expect(result.tools?.profile).toBe("minimal");
    expect(result.tools?.alsoAllow).toEqual(["existing_tool", "message", "read"]);
    expect(result.tools?.deny).toEqual([
      "existing_deny",
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
    ]);
  });
});
