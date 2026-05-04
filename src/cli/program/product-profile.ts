import { logAcceptedEnvOption } from "../../infra/env.js";
import {
  isLocalSoloProductProfile,
  PRODUCT_PROFILE_ENV,
  resolveProductProfile,
  type ProductProfile,
} from "../../shared/product-profile.js";
import type { NamedCommandDescriptor } from "./command-group-descriptors.js";

export const CLI_PRODUCT_PROFILE_ENV = PRODUCT_PROFILE_ENV;

export type CliProductProfile = ProductProfile;

const LOCAL_SOLO_CORE_COMMANDS = new Set([
  "setup",
  "onboard",
  "configure",
  "config",
  "doctor",
  "agent",
  "status",
  "health",
  "sessions",
]);

const LOCAL_SOLO_SUBCLI_COMMANDS = new Set(["gateway", "models", "skills"]);

export function resolveCliProductProfile(env: NodeJS.ProcessEnv = process.env): CliProductProfile {
  const profile = resolveProductProfile(env);
  if (profile === "local-solo") {
    logAcceptedEnvOption({
      key: CLI_PRODUCT_PROFILE_ENV,
      description: "CLI product profile",
      value: env[CLI_PRODUCT_PROFILE_ENV],
    });
  }
  return profile;
}

export function isLocalSoloCliProductProfile(env: NodeJS.ProcessEnv = process.env): boolean {
  return isLocalSoloProductProfile(env);
}

function filterDescriptorsByNames<TDescriptor extends NamedCommandDescriptor>(
  descriptors: readonly TDescriptor[],
  allowedNames: ReadonlySet<string>,
): TDescriptor[] {
  return descriptors.filter((descriptor) => allowedNames.has(descriptor.name));
}

export function filterCoreCliDescriptorsForProductProfile<
  TDescriptor extends NamedCommandDescriptor,
>(descriptors: readonly TDescriptor[], env: NodeJS.ProcessEnv = process.env): TDescriptor[] {
  if (!isLocalSoloCliProductProfile(env)) {
    return [...descriptors];
  }
  return filterDescriptorsByNames(descriptors, LOCAL_SOLO_CORE_COMMANDS);
}

export function filterSubCliDescriptorsForProductProfile<
  TDescriptor extends NamedCommandDescriptor,
>(descriptors: readonly TDescriptor[], env: NodeJS.ProcessEnv = process.env): TDescriptor[] {
  if (!isLocalSoloCliProductProfile(env)) {
    return [...descriptors];
  }
  return filterDescriptorsByNames(descriptors, LOCAL_SOLO_SUBCLI_COMMANDS);
}
