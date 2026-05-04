import type { Command } from "commander";
import {
  configureCommandFromSectionsArg,
  getConfigureWizardSections,
} from "../../commands/configure.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { runCommandWithRuntime } from "../cli-utils.js";
import { isLocalSoloCliProductProfile } from "./product-profile.js";

export function registerConfigureCommand(program: Command) {
  const localSolo = isLocalSoloCliProductProfile();
  const configureSections = getConfigureWizardSections();
  program
    .command("configure")
    .description(
      localSolo
        ? "Interactive configuration for credentials, gateway, web tools, and agent defaults"
        : "Interactive configuration for credentials, channels, gateway, and agent defaults",
    )
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/configure", "docs.openclaw.ai/cli/configure")}\n`,
    )
    .option(
      "--section <section>",
      `Configuration sections (repeatable). Options: ${configureSections.join(", ")}`,
      (value: string, previous: string[]) => [...previous, value],
      [] as string[],
    )
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await configureCommandFromSectionsArg(opts.section, defaultRuntime);
      });
    });
}
