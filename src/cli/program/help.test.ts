import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProgramContext } from "./context.js";
import { configureProgramHelp } from "./help.js";

const hasEmittedCliBannerMock = vi.hoisted(() => vi.fn(() => false));
const formatCliBannerLineMock = vi.hoisted(() => vi.fn(() => "BANNER-LINE"));
const formatDocsLinkMock = vi.hoisted(() =>
  vi.fn((_path: string, full: string) => `https://${full}`),
);
const resolveCommitHashMock = vi.hoisted(() => vi.fn<() => string | null>(() => "abc1234"));

vi.mock("../../terminal/links.js", () => ({
  formatDocsLink: formatDocsLinkMock,
}));

vi.mock("../../terminal/theme.js", () => ({
  isRich: () => false,
  theme: {
    heading: (s: string) => s,
    muted: (s: string) => s,
    option: (s: string) => s,
    command: (s: string) => s,
    error: (s: string) => s,
  },
}));

vi.mock("../banner.js", () => ({
  formatCliBannerLine: formatCliBannerLineMock,
  hasEmittedCliBanner: hasEmittedCliBannerMock,
}));

vi.mock("../../infra/git-commit.js", () => ({
  resolveCommitHash: resolveCommitHashMock,
}));

vi.mock("../cli-name.js", () => ({
  resolveCliName: () => "openclaw",
  replaceCliName: (cmd: string) => cmd,
}));

vi.mock("./command-registry.js", () => ({
  getCoreCliCommandsWithSubcommands: () => ["models", "message"],
}));

vi.mock("./register.subclis.js", () => ({
  getSubCliCommandsWithSubcommands: () => ["gateway"],
}));

const testProgramContext: ProgramContext = {
  programVersion: "9.9.9-test",
  channelOptions: ["quietchat"],
  messageChannelOptions: "quietchat",
  agentChannelOptions: "last|quietchat",
};

describe("configureProgramHelp", () => {
  let originalArgv: string[];
  let originalProductProfile: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalArgv = [...process.argv];
    originalProductProfile = process.env.OPENCLAW_PRODUCT_PROFILE;
    hasEmittedCliBannerMock.mockReturnValue(false);
    resolveCommitHashMock.mockReturnValue("abc1234");
    delete process.env.OPENCLAW_PRODUCT_PROFILE;
  });

  afterEach(() => {
    process.argv = originalArgv;
    if (originalProductProfile === undefined) {
      delete process.env.OPENCLAW_PRODUCT_PROFILE;
    } else {
      process.env.OPENCLAW_PRODUCT_PROFILE = originalProductProfile;
    }
  });

  function makeProgramWithCommands() {
    const program = new Command();
    program.command("models").description("models");
    program.command("status").description("status");
    return program;
  }

  function captureHelpOutput(program: Command): string {
    let output = "";
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(((
      chunk: string | Uint8Array,
    ) => {
      output += String(chunk);
      return true;
    }) as typeof process.stdout.write);
    try {
      program.outputHelp();
      return output;
    } finally {
      writeSpy.mockRestore();
    }
  }

  function expectVersionExit(params: { expectedVersion: string }) {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? ""}`);
    }) as typeof process.exit);

    try {
      const program = makeProgramWithCommands();
      expect(() => configureProgramHelp(program, testProgramContext)).toThrow("exit:0");
      expect(logSpy).toHaveBeenCalledWith(params.expectedVersion);
      expect(exitSpy).toHaveBeenCalledWith(0);
    } finally {
      logSpy.mockRestore();
      exitSpy.mockRestore();
    }
  }

  it("adds root help hint and marks commands with subcommands", () => {
    process.argv = ["node", "openclaw", "--help"];
    const program = makeProgramWithCommands();
    configureProgramHelp(program, testProgramContext);

    const help = captureHelpOutput(program);
    expect(help).toContain("Hint: commands suffixed with * have subcommands");
    expect(help).toContain("models *");
    expect(help).toContain("status");
    expect(help).not.toContain("status *");
  });

  it("includes banner and docs/examples in root help output", () => {
    process.argv = ["node", "openclaw", "--help"];
    const program = makeProgramWithCommands();
    configureProgramHelp(program, testProgramContext);

    const help = captureHelpOutput(program);
    expect(help).toContain("BANNER-LINE");
    expect(help).toContain("Examples:");
    expect(help).toContain("https://docs.openclaw.ai/cli");
  });

  it("uses local-solo root examples when the product profile is enabled", () => {
    process.argv = ["node", "openclaw", "--help"];
    process.env.OPENCLAW_PRODUCT_PROFILE = "local-solo";
    const program = makeProgramWithCommands();
    configureProgramHelp(program, testProgramContext);

    const help = captureHelpOutput(program);
    expect(help).toContain("openclaw setup");
    expect(help).toContain("openclaw skills list");
    expect(help).toContain('openclaw agent --local --message "Summarize this workspace"');
    expect(help).not.toContain("openclaw channels login --verbose");
    expect(help).not.toContain('openclaw message send --target +15555550123 --message "Hi" --json');
  });

  it("prints version and exits immediately when version flags are present", () => {
    process.argv = ["node", "openclaw", "--version"];
    expectVersionExit({ expectedVersion: "OpenClaw 9.9.9-test (abc1234)" });
  });

  it("prints version and exits immediately without commit metadata", () => {
    process.argv = ["node", "openclaw", "--version"];
    resolveCommitHashMock.mockReturnValue(null);
    expectVersionExit({ expectedVersion: "OpenClaw 9.9.9-test" });
  });
});
