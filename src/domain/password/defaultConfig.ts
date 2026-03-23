import type { PasswordAnalysisConfig, PasswordPolicyConfig, StrengthConfig } from "./models";
import { RuleIds } from "./models";

const defaultPolicy: PasswordPolicyConfig = {
  minLength: 10,
  maxLength: 128,

  uppercaseRegex: "[A-Z]",
  lowercaseRegex: "[a-z]",
  numberRegex: "[0-9]",
  specialRegex: "[^A-Za-z0-9]",

  disallowWhitespace: true,

  noRepeatedSequences: {
    minSeqLen: 2,
    maxSeqCount: 2,
    allowOverlapping: true,
  },

  entropyAtLeast: {
    entropyMinBits: 35,
  },

  requireConfirmMatch: false,
};

const defaultStrength: StrengthConfig = {
  thresholds: {
    veryWeakMax: 24,
    weakMax: 49,
    mediumMax: 69,
  },
};

export function createDefaultPasswordAnalysisConfig(): PasswordAnalysisConfig {
  return {
    enabledRuleIds: [
      "minLength",
      "maxLength",
      "hasUppercase",
      "hasLowercase",
      "hasNumber",
      "hasSpecial",
      "noSpaces",
      "noRepeatedSequences",
      "noCommonPassword",
      "entropyAtLeast",
      // confirmMatches intentionally excluded by default.
    ],
    policy: defaultPolicy,
    passFail: {
      passRequiresAllEnabledRules: false,
      minimumRulesPassedCount: 7,
      hardFailRuleIds: ["maxLength", "noCommonPassword"],
    },
    strength: defaultStrength,
    scoring: {
      perRule: {},
      clamp: { min: 0, max: 100 },
    },
  };
}

// Small helper for future rules settings UI.
export const DefaultEnabledRuleIds = createDefaultPasswordAnalysisConfig().enabledRuleIds;
export const DefaultHardFailRuleIds = createDefaultPasswordAnalysisConfig().passFail.hardFailRuleIds;

