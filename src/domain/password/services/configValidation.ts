import type {
  InvalidRulesConfigError,
  PasswordAnalysisConfig,
  PasswordPolicyConfig,
  RuleId,
  StrengthThresholds,
} from "../models";
import { RuleIds } from "../models";

function errorResult(message: string, details?: InvalidRulesConfigError["details"]): InvalidRulesConfigError {
  return {
    state: "error",
    name: "InvalidRulesConfigError",
    message,
    details,
  };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function validateStrengthThresholds(th: StrengthThresholds): string[] {
  const issues: string[] = [];
  const { veryWeakMax, weakMax, mediumMax } = th;
  if (!isFiniteNumber(veryWeakMax)) issues.push("veryWeakMax must be a finite number");
  if (!isFiniteNumber(weakMax)) issues.push("weakMax must be a finite number");
  if (!isFiniteNumber(mediumMax)) issues.push("mediumMax must be a finite number");

  if (issues.length > 0) return issues;

  if (!(veryWeakMax >= 0)) issues.push("veryWeakMax must be >= 0");
  if (!(weakMax >= veryWeakMax)) issues.push("weakMax must be >= veryWeakMax");
  if (!(mediumMax >= weakMax)) issues.push("mediumMax must be >= weakMax");
  if (mediumMax > 100) issues.push("mediumMax must be <= 100");
  return issues;
}

function validatePolicy(policy: PasswordPolicyConfig): string[] {
  const issues: string[] = [];
  if (!isFiniteNumber(policy.minLength) || policy.minLength < 0) issues.push("policy.minLength must be >= 0");
  if (!isFiniteNumber(policy.maxLength) || policy.maxLength < 0) issues.push("policy.maxLength must be >= 0");
  if (isFiniteNumber(policy.minLength) && isFiniteNumber(policy.maxLength) && policy.minLength > policy.maxLength) {
    issues.push("policy.minLength must be <= policy.maxLength");
  }

  const regexFields: Array<keyof PasswordPolicyConfig> = [
    "uppercaseRegex",
    "lowercaseRegex",
    "numberRegex",
    "specialRegex",
  ];
  for (const field of regexFields) {
    const value = policy[field];
    if (typeof value !== "string" || value.length === 0) {
      issues.push(`policy.${String(field)} must be a non-empty string`);
      continue;
    }
    try {
      // Ensure it compiles.
      // Engines will recreate `new RegExp(source, "u")`.
      new RegExp(value, "u");
    } catch {
      issues.push(`policy.${String(field)} is not a valid regex`);
    }
  }

  if (!isFiniteNumber(policy.noRepeatedSequences.minSeqLen) || policy.noRepeatedSequences.minSeqLen < 1) {
    issues.push("policy.noRepeatedSequences.minSeqLen must be >= 1");
  }
  if (!isFiniteNumber(policy.noRepeatedSequences.maxSeqCount) || policy.noRepeatedSequences.maxSeqCount < 0) {
    issues.push("policy.noRepeatedSequences.maxSeqCount must be >= 0");
  }
  if (typeof policy.noRepeatedSequences.allowOverlapping !== "boolean") {
    issues.push("policy.noRepeatedSequences.allowOverlapping must be boolean");
  }

  if (policy.entropyAtLeast) {
    if (!isFiniteNumber(policy.entropyAtLeast.entropyMinBits) || policy.entropyAtLeast.entropyMinBits < 0) {
      issues.push("policy.entropyAtLeast.entropyMinBits must be >= 0");
    }
  }

  if (typeof policy.requireConfirmMatch !== "boolean") {
    issues.push("policy.requireConfirmMatch must be boolean");
  }

  return issues;
}

function validateEnabledRuleIds(enabledRuleIds: RuleId[]): string[] {
  const issues: string[] = [];
  if (!Array.isArray(enabledRuleIds) || enabledRuleIds.length === 0) {
    issues.push("enabledRuleIds must be a non-empty array");
    return issues;
  }
  const allowed = new Set<RuleId>(RuleIds as unknown as RuleId[]);
  for (const id of enabledRuleIds) {
    if (!allowed.has(id)) issues.push(`enabledRuleIds contains unknown ruleId: ${String(id)}`);
  }

  if (new Set(enabledRuleIds).size !== enabledRuleIds.length) {
    issues.push("enabledRuleIds must not contain duplicates");
  }
  return issues;
}

export function validatePasswordAnalysisConfig(config: PasswordAnalysisConfig): InvalidRulesConfigError | null {
  if (!config || typeof config !== "object") {
    return errorResult("Config must be an object");
  }

  const fieldErrors: Array<{ path: string; message: string }> = [];

  const enabledIssues = validateEnabledRuleIds(config.enabledRuleIds);
  for (const msg of enabledIssues) fieldErrors.push({ path: "enabledRuleIds", message: msg });

  const policyIssues = validatePolicy(config.policy);
  for (const msg of policyIssues) fieldErrors.push({ path: "policy", message: msg });

  const thIssues = validateStrengthThresholds(config.strength.thresholds);
  for (const msg of thIssues) fieldErrors.push({ path: "strength.thresholds", message: msg });

  const scoringClamp = config.scoring?.clamp;
  if (!scoringClamp || typeof scoringClamp !== "object") {
    fieldErrors.push({ path: "scoring.clamp", message: "scoring.clamp is required" });
  } else {
    if (!isFiniteNumber(scoringClamp.min) || !isFiniteNumber(scoringClamp.max)) {
      fieldErrors.push({ path: "scoring.clamp", message: "clamp.min and clamp.max must be finite numbers" });
    } else if (scoringClamp.min >= scoringClamp.max) {
      fieldErrors.push({ path: "scoring.clamp", message: "clamp.min must be < clamp.max" });
    }
  }

  const passFail = config.passFail;
  if (!passFail || typeof passFail !== "object") {
    fieldErrors.push({ path: "passFail", message: "passFail is required" });
  } else {
    if (typeof passFail.passRequiresAllEnabledRules !== "boolean") {
      fieldErrors.push({ path: "passFail.passRequiresAllEnabledRules", message: "must be boolean" });
    }
    if (
      passFail.passRequiresAllEnabledRules === false &&
      (typeof passFail.minimumRulesPassedCount !== "number" || passFail.minimumRulesPassedCount < 0)
    ) {
      fieldErrors.push({
        path: "passFail.minimumRulesPassedCount",
        message: "must be a non-negative number when passRequiresAllEnabledRules is false",
      });
    }
    if (!Array.isArray(passFail.hardFailRuleIds) || passFail.hardFailRuleIds.length === 0) {
      fieldErrors.push({ path: "passFail.hardFailRuleIds", message: "must be a non-empty array" });
    }
  }

  if (fieldErrors.length > 0) {
    return errorResult("Invalid password analysis config", { message: "Validation failed", fieldErrors });
  }

  return null;
}

