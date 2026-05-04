import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerSetupCommand } from "./register.setup.js";

const mocks = vi.hoisted(() => ({
  setupCommandMock: vi.fn(),
  setupWizardCommandMock: vi.fn(),
  runtime: {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  },
}));

const setupCommandMock = mocks.setupCommandMock;
const setupWizardCommandMock = mocks.setupWizardCommandMock;
const runtime = mocks.runtime;

vi.mock("../../commands/setup.js", () => ({
  setupCommand: mocks.setupCommandMock,
}));

vi.mock("../../commands/onboard.js", () => ({
  setupWizardCommand: mocks.setupWizardCommandMock,
}));

vi.mock("../../runtime.js", () => ({
  defaultRuntime: mocks.runtime,
}));

describe("registerSetupCommand", () => {
  const originalProductProfile = process.env.OPENCLAW_PRODUCT_PROFILE;

  async function runCli(args: string[]) {
    const program = new Command();
    registerSetupCommand(program);
    await program.parseAsync(args, { from: "user" });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setupCommandMock.mockResolvedValue(undefined);
    setupWizardCommandMock.mockResolvedValue(undefined);
    if (originalProductProfile === undefined) {
      delete process.env.OPENCLAW_PRODUCT_PROFILE;
    } else {
      process.env.OPENCLAW_PRODUCT_PROFILE = originalProductProfile;
    }
  });

  it("hides remote setup flags in the local-solo profile", () => {
    process.env.OPENCLAW_PRODUCT_PROFILE = "local-solo";

    const program = new Command();
    registerSetupCommand(program);
    const help = program.commands[0]?.helpInformation() ?? "";

    expect(help).toContain("active local config and main agent workspace");
    expect(help).not.toContain("--mode <mode>");
    expect(help).not.toContain("--remote-url <url>");
    expect(help).not.toContain("--remote-token <token>");
    expect(help).toContain("--wizard");
    expect(help).toContain("--non-interactive");
  });

  it("runs setup command by default", async () => {
    await runCli(["setup", "--workspace", "/tmp/ws"]);

    expect(setupCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: "/tmp/ws",
      }),
      runtime,
    );
    expect(setupWizardCommandMock).not.toHaveBeenCalled();
  });

  it("runs setup wizard command when --wizard is set", async () => {
    await runCli(["setup", "--wizard", "--mode", "remote", "--remote-url", "wss://example"]);

    expect(setupWizardCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "remote",
        remoteUrl: "wss://example",
      }),
      runtime,
    );
    expect(setupCommandMock).not.toHaveBeenCalled();
  });

  it("runs setup wizard command when wizard-only flags are passed explicitly", async () => {
    await runCli(["setup", "--mode", "remote", "--non-interactive"]);

    expect(setupWizardCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "remote",
        nonInteractive: true,
      }),
      runtime,
    );
    expect(setupCommandMock).not.toHaveBeenCalled();
  });

  it("runs setup wizard command for migration import flags", async () => {
    await runCli([
      "setup",
      "--import-from",
      "hermes",
      "--import-source",
      "/tmp/hermes",
      "--import-secrets",
    ]);

    expect(setupWizardCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        importFrom: "hermes",
        importSource: "/tmp/hermes",
        importSecrets: true,
      }),
      runtime,
    );
    expect(setupCommandMock).not.toHaveBeenCalled();
  });

  it("reports setup errors through runtime", async () => {
    setupCommandMock.mockRejectedValueOnce(new Error("setup failed"));

    await runCli(["setup"]);

    expect(runtime.error).toHaveBeenCalledWith("Error: setup failed");
    expect(runtime.exit).toHaveBeenCalledWith(1);
  });
});
