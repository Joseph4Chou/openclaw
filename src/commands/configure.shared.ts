import {
  confirm as clackConfirm,
  intro as clackIntro,
  outro as clackOutro,
  select as clackSelect,
  text as clackText,
} from "@clack/prompts";
import { isLocalSoloProductProfile } from "../shared/product-profile.js";
import { normalizeStringEntries } from "../shared/string-normalization.js";
import { stylePromptHint, stylePromptMessage, stylePromptTitle } from "../terminal/prompt-style.js";

export const CONFIGURE_WIZARD_SECTIONS = [
  "workspace",
  "model",
  "web",
  "gateway",
  "daemon",
  "channels",
  "plugins",
  "skills",
  "health",
] as const;

export type WizardSection = (typeof CONFIGURE_WIZARD_SECTIONS)[number];

const LOCAL_SOLO_HIDDEN_CONFIGURE_SECTIONS = new Set<WizardSection>(["channels"]);

const LOCAL_SOLO_SECTION_HINT_OVERRIDES: Partial<Record<WizardSection, string>> = {
  web: "Configure web fetch + readability",
  gateway: "Port, auth, and local gateway access",
  plugins: "Configure bundled providers, memory, and helper plugins",
  skills: "Review the workspace skills kept in this profile",
  health: "Run local gateway checks",
};

export function getConfigureWizardSections(env: NodeJS.ProcessEnv = process.env): WizardSection[] {
  if (!isLocalSoloProductProfile(env)) {
    return [...CONFIGURE_WIZARD_SECTIONS];
  }
  return CONFIGURE_WIZARD_SECTIONS.filter(
    (section) => !LOCAL_SOLO_HIDDEN_CONFIGURE_SECTIONS.has(section),
  );
}

export function getConfigureSectionOptions(env: NodeJS.ProcessEnv = process.env): Array<{
  value: WizardSection;
  label: string;
  hint: string;
}> {
  const localSolo = isLocalSoloProductProfile(env);
  const allowed = new Set(getConfigureWizardSections(env));
  return CONFIGURE_SECTION_OPTIONS.filter((option) => allowed.has(option.value)).map((option) => {
    const localSoloHint = localSolo ? LOCAL_SOLO_SECTION_HINT_OVERRIDES[option.value] : undefined;
    return localSoloHint ? { ...option, hint: localSoloHint } : option;
  });
}

export function parseConfigureWizardSections(raw: unknown): {
  sections: WizardSection[];
  invalid: string[];
} {
  const allowedSections = getConfigureWizardSections();
  const sectionsRaw: string[] = Array.isArray(raw) ? normalizeStringEntries(raw) : [];
  if (sectionsRaw.length === 0) {
    return { sections: [], invalid: [] };
  }

  const invalid = sectionsRaw.filter((s) => !allowedSections.includes(s as never));
  const sections = sectionsRaw.filter((s): s is WizardSection =>
    allowedSections.includes(s as never),
  );
  return { sections, invalid };
}

export type ChannelsWizardMode = "configure" | "remove";

export type ConfigureWizardParams = {
  command: "configure" | "update";
  sections?: WizardSection[];
};

export const CONFIGURE_SECTION_OPTIONS: Array<{
  value: WizardSection;
  label: string;
  hint: string;
}> = [
  { value: "workspace", label: "Workspace", hint: "Set workspace + sessions" },
  { value: "model", label: "Model", hint: "Pick provider + credentials" },
  { value: "web", label: "Web tools", hint: "Configure web search (Perplexity/Brave) + fetch" },
  { value: "gateway", label: "Gateway", hint: "Port, bind, auth, tailscale" },
  {
    value: "daemon",
    label: "Daemon",
    hint: "Install/manage the background service",
  },
  {
    value: "channels",
    label: "Channels",
    hint: "Link WhatsApp/Telegram/etc and defaults",
  },
  { value: "plugins", label: "Plugins", hint: "Configure plugin settings (sandbox, tools, etc.)" },
  { value: "skills", label: "Skills", hint: "Install/enable workspace skills" },
  {
    value: "health",
    label: "Health check",
    hint: "Run gateway + channel checks",
  },
];

export const intro = (message: string) => clackIntro(stylePromptTitle(message) ?? message);
export const outro = (message: string) => clackOutro(stylePromptTitle(message) ?? message);
export const text = (params: Parameters<typeof clackText>[0]) =>
  clackText({
    ...params,
    message: stylePromptMessage(params.message),
  });
export const confirm = (params: Parameters<typeof clackConfirm>[0]) =>
  clackConfirm({
    ...params,
    message: stylePromptMessage(params.message),
  });
export const select = <T>(params: Parameters<typeof clackSelect<T>>[0]) =>
  clackSelect({
    ...params,
    message: stylePromptMessage(params.message),
    options: params.options.map((opt) =>
      opt.hint === undefined ? opt : { ...opt, hint: stylePromptHint(opt.hint) },
    ),
  });
