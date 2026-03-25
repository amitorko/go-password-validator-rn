import type { PasswordAnalysisConfig } from "../../domain/password/models";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import { CommonPasswordService } from "../../domain/password/services/CommonPasswordService";

export const commonPasswordService = new CommonPasswordService();

/**
 * Returns a fresh default config (deep enough for tests that mutate draft copies).
 */
export function cloneDefaultConfig(): PasswordAnalysisConfig {
  return createDefaultPasswordAnalysisConfig();
}

export function withConfig(overrides: Partial<PasswordAnalysisConfig>): PasswordAnalysisConfig {
  const base = cloneDefaultConfig();
  return { ...base, ...overrides };
}
