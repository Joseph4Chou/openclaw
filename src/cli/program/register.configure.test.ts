import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerConfigureCommand } from "./register.configure.js";

const mocks = vi.hoisted(() => ({
  configureCommandFromSectionsArgMock: vi.fn(),
  runtime: {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  },
}));

const { configureCommandFromSectionsArgMock, runtime } = mocks;

vi.mock("../../commands/configure.js", () => ({
  CONFIGURE_WIZARD_SECTIONS: [
    "workspace",
    "model",
    "web",
    "gateway",
    "daemon",
    "channels",
    "plugins",
    "skills",
    "health",
  ],
  getConfigureWizardSections: () =>
    process.env.OPENCLAW_PRODUCT_PROFILE === "local-solo"
      ? ["workspace", "model", "web", "gateway", "daemon", "plugins", "skills", "health"]
      : [
          "workspace",
          "model",
          "web",
          "gateway",
          "daemon",
          "channels",
          "plugins",
          "skills",
          "health",
        ],
  configureCommandFromSectionsArg: mocks.configureCommandFromSectionsArgMock,
}));

vi.mock("../../runtime.js", () => ({
  defaultRuntime: mocks.runtime,
}));

describe("registerConfigureCommand", () => {
  const originalProductProfile = process.env.OPENCLAW_PRODUCT_PROFILE;

  async function runCli(args: string[]) {
    const program = new Command();
    registerConfigureCommand(program);
    await program.parseAsync(args, { from: "user" });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    configureCommandFromSectionsArgMock.mockResolvedValue(undefined);
    if (originalProductProfile === undefined) {
      delete process.env.OPENCLAW_PRODUCT_PROFILE;
    } else {
      process.env.OPENCLAW_PRODUCT_PROFILE = originalProductProfile;
    }
  });

  it("filters channel sections from configure help in the local-solo profile", () => {
    process.env.OPENCLAW_PRODUCT_PROFILE = "local-solo";

    const program = new Command();
    registerConfigureCommand(program);
    const help = program.commands[0]?.helpInformation() ?? "";
    const compactHelp = help.replace(/\s+/g, " ");

    expect(compactHelp).toContain("Interactive configuration for credentials, gateway, web tools");
    expect(compactHelp).toContain(
      "workspace, model, web, gateway, daemon, plugins, skills, health",
    );
    expect(compactHelp).not.toContain("channels");
  });

  it("forwards repeated --section values", async () => {
    await runCli(["configure", "--section", "gateway", "--section", "channels"]);

    expect(configureCommandFromSectionsArgMock).toHaveBeenCalledWith(
      ["gateway", "channels"],
      runtime,
    );
  });

  it("reports errors through runtime when configure command fails", async () => {
    configureCommandFromSectionsArgMock.mockRejectedValueOnce(new Error("configure failed"));

    await runCli(["configure"]);

    expect(runtime.error).toHaveBeenCalledWith("Error: configure failed");
    expect(runtime.exit).toHaveBeenCalledWith(1);
  });
});
