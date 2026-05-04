import { render } from "lit";
import { describe, expect, it } from "vitest";
import { renderAgentSkills, renderAgentTools } from "./agents-panels-tools-skills.ts";

function createBaseParams(overrides: Partial<Parameters<typeof renderAgentTools>[0]> = {}) {
  return {
    agentId: "main",
    configForm: {
      agents: {
        list: [{ id: "main", tools: { profile: "full" } }],
      },
    } as Record<string, unknown>,
    configLoading: false,
    configSaving: false,
    configDirty: false,
    toolsCatalogLoading: false,
    toolsCatalogError: null,
    toolsCatalogResult: null,
    toolsEffectiveLoading: false,
    toolsEffectiveError: null,
    toolsEffectiveResult: null,
    runtimeSessionKey: "main",
    runtimeSessionMatchesSelectedAgent: true,
    onProfileChange: () => undefined,
    onOverridesChange: () => undefined,
    onConfigReload: () => undefined,
    onConfigSave: () => undefined,
    ...overrides,
  };
}

function createAgentSkillsParams(overrides: Partial<Parameters<typeof renderAgentSkills>[0]> = {}) {
  return {
    agentId: "main",
    report: {
      workspaceDir: "/tmp/workspace",
      managedSkillsDir: "/tmp/skills",
      skills: [
        {
          name: "nano-pdf",
          description: "Read PDFs",
          source: "openclaw-workspace",
          filePath: "/tmp/skill",
          baseDir: "/tmp",
          skillKey: "nano-pdf",
          bundled: false,
          primaryEnv: undefined,
          emoji: undefined,
          homepage: undefined,
          always: false,
          disabled: false,
          blockedByAllowlist: false,
          eligible: true,
          requirements: { bins: [], env: [], config: [], os: [] },
          missing: { bins: [], env: [], config: [], os: [] },
          configChecks: [],
          install: [],
        },
      ],
    },
    loading: false,
    error: null,
    activeAgentId: "main",
    configForm: {
      agents: {
        list: [{ id: "main", skills: ["nano-pdf"] }],
      },
    } as Record<string, unknown>,
    configLoading: false,
    configSaving: false,
    configDirty: false,
    filter: "",
    onFilterChange: () => undefined,
    onRefresh: () => undefined,
    onToggle: () => undefined,
    onClear: () => undefined,
    onDisableAll: () => undefined,
    onConfigReload: () => undefined,
    onConfigSave: () => undefined,
    ...overrides,
  };
}

describe("agents tools panel (browser)", () => {
  it("renders catalog provenance and effective runtime tools", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [
              { id: "minimal", label: "Minimal" },
              { id: "coding", label: "Coding" },
              { id: "messaging", label: "Messaging" },
              { id: "full", label: "Full" },
            ],
            groups: [
              {
                id: "media",
                label: "Media",
                source: "core",
                tools: [
                  {
                    id: "tts",
                    label: "tts",
                    description: "Text-to-speech conversion",
                    source: "core",
                    defaultProfiles: [],
                  },
                ],
              },
              {
                id: "plugin:voice-call",
                label: "voice-call",
                source: "plugin",
                pluginId: "voice-call",
                tools: [
                  {
                    id: "voice_call",
                    label: "voice_call",
                    description: "Voice call tool",
                    source: "plugin",
                    pluginId: "voice-call",
                    optional: true,
                    defaultProfiles: [],
                  },
                ],
              },
            ],
          },
          toolsEffectiveResult: {
            agentId: "main",
            profile: "messaging",
            groups: [
              {
                id: "channel",
                label: "Channel tools",
                source: "channel",
                tools: [
                  {
                    id: "message",
                    label: "Message Actions",
                    description: "Send and manage messages in this channel",
                    rawDescription: "Send and manage messages in this channel",
                    source: "channel",
                    channelId: "guildchat",
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Built-In");
    expect(text).toContain("Plugin: voice-call");
    expect(text).toContain("Optional");
    expect(text).toContain("Available Right Now");
    expect(text).toContain("Message Actions");
    expect(text).toContain("Channel: guildchat");
    expect(container.querySelector(".agent-tool-card[open]")).toBeNull();
  });

  it("shows fallback warning when runtime catalog fails", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogError: "unavailable",
          toolsCatalogResult: null,
        }),
      ),
      container,
    );
    await Promise.resolve();

    expect(container.textContent ?? "").toContain("Could not load runtime tool catalog");
  });

  it("closes expanded tool rows when the parent group collapses", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "files",
                label: "Files",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    source: "core",
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const group = container.querySelector<HTMLDetailsElement>(".agent-tools-group");
    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");

    expect(group).not.toBeNull();
    expect(tool).not.toBeNull();

    if (!group || !tool) {
      return;
    }

    group.open = true;
    tool.open = true;

    group.open = false;
    group.dispatchEvent(new Event("toggle"));

    expect(tool.open).toBe(false);
  });

  it("keeps the access toggle inside the collapsed tool summary", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "files",
                label: "Files",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    source: "core",
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");
    const summary = container.querySelector<HTMLElement>(".agent-tool-summary");
    const toggle = container.querySelector<HTMLInputElement>(".agent-tool-toggle input");

    expect(tool?.open).toBe(false);
    expect(toggle?.closest(".agent-tool-summary")).toBe(summary);
  });

  it("uses section-level plugin provenance for tool details", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "plugin:voice-call",
                label: "voice-call",
                source: "plugin",
                pluginId: "voice-call",
                tools: [
                  {
                    id: "voice_call",
                    label: "voice_call",
                    description: "Voice call tool",
                    source: undefined as never,
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");
    tool!.open = true;

    const sourceDetail = Array.from(
      container.querySelectorAll<HTMLElement>(".agent-tool-detail"),
    ).find((detail) => detail.textContent?.includes("Source"));

    expect(sourceDetail?.textContent).toContain("Plugin: voice-call");
  });

  it("opens the collapsed group and tool row from a live tool chip", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "files",
                label: "Files",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    source: "core",
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
          toolsEffectiveResult: {
            agentId: "main",
            profile: "full",
            groups: [
              {
                id: "core",
                label: "Built-in tools",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    rawDescription: "Read file contents",
                    source: "core",
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const group = container.querySelector<HTMLDetailsElement>(".agent-tools-group");
    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");
    const chip = container.querySelector<HTMLAnchorElement>(
      '.agent-tools-runtime-chip[href="#agent-tool-read"]',
    );

    expect(group).not.toBeNull();
    expect(tool).not.toBeNull();
    expect(chip).not.toBeNull();

    if (!group || !tool || !chip) {
      container.remove();
      return;
    }

    expect(group.open).toBe(false);
    expect(tool.open).toBe(false);

    chip.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(group.open).toBe(true);
    expect(tool.open).toBe(true);

    container.remove();
  });

  it("uses workspace-skills copy in the agent skills panel", async () => {
    const container = document.createElement("div");

    render(renderAgentSkills(createAgentSkillsParams()), container);
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Choose which kept workspace skills this agent can use.");
    expect(text).toContain("This agent uses a custom workspace-skill allowlist.");
    expect(
      container.querySelector<HTMLInputElement>('input[name="agent-skills-filter"]')?.placeholder,
    ).toBe("Search workspace skills");
  });
});
