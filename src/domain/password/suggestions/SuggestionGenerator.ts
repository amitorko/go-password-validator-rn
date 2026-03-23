import type {
  PasswordAnalysisConfig,
  RuleId,
  RuleResult,
  SuggestionItem,
} from "../models";

export type SuggestionOutput = {
  warnings: string[];
  suggestions: SuggestionItem[];
};

const WARNING_TEXT: Partial<Record<RuleId, (cfg: PasswordAnalysisConfig) => string>> = {
  minLength: (cfg) => `Too short (need at least ${cfg.policy.minLength} characters).`,
  maxLength: (cfg) => `Too long (max is ${cfg.policy.maxLength} characters).`,
  noSpaces: () => "Whitespace is not allowed by current policy.",
  noRepeatedSequences: () => "Repeated patterns detected. Avoid repeating the same substring often.",
  noCommonPassword: () => "Password appears in the common-password list.",
  confirmMatches: () => "Confirmation password does not match.",
  entropyAtLeast: () => "Entropy estimate is below the configured threshold.",
};

export function generateSuggestions(
  results: RuleResult[],
  config: PasswordAnalysisConfig,
): SuggestionOutput {
  const byRule = new Map<RuleId, RuleResult>(results.map((r) => [r.ruleId, r]));
  const warnings: string[] = [];
  const suggestions: SuggestionItem[] = [];
  const seenSuggestionIds = new Set<string>();

  const pushUniqueWarning = (w: string) => {
    if (!warnings.includes(w)) warnings.push(w);
  };

  const addSuggestion = (id: string, text: string, relatedRuleIds?: RuleId[]) => {
    if (seenSuggestionIds.has(id)) return;
    seenSuggestionIds.add(id);
    suggestions.push({
      id,
      text,
      severity: "warning",
      relatedRuleIds,
    });
  };

  for (const ruleId of config.enabledRuleIds) {
    const r = byRule.get(ruleId);
    if (!r || r.passed) continue;

    const warnFn = WARNING_TEXT[ruleId];
    if (warnFn) pushUniqueWarning(warnFn(config));

    switch (ruleId) {
      case "minLength":
        addSuggestion(
          "minLength",
          `Increase length to at least ${config.policy.minLength} characters.`,
          ["minLength"],
        );
        break;
      case "maxLength":
        addSuggestion(
          "maxLength",
          `Keep the password under ${config.policy.maxLength} characters.`,
          ["maxLength"],
        );
        break;
      case "hasUppercase":
        addSuggestion("hasUppercase", "Add at least one uppercase letter (A-Z).", ["hasUppercase"]);
        break;
      case "hasLowercase":
        addSuggestion("hasLowercase", "Add at least one lowercase letter (a-z).", ["hasLowercase"]);
        break;
      case "hasNumber":
        addSuggestion("hasNumber", "Add at least one number (0-9).", ["hasNumber"]);
        break;
      case "hasSpecial":
        addSuggestion(
          "hasSpecial",
          "Add a special character (example: ! @ # $ %).",
          ["hasSpecial"],
        );
        break;
      case "noSpaces":
        addSuggestion("noSpaces", "Remove spaces or other whitespace characters.", ["noSpaces"]);
        break;
      case "noRepeatedSequences":
        addSuggestion(
          "noRepeatedSequences",
          `Avoid repeating the same ${config.policy.noRepeatedSequences.minSeqLen}-character sequence too often.`,
          ["noRepeatedSequences"],
        );
        break;
      case "noCommonPassword":
        addSuggestion(
          "noCommonPassword",
          "Choose a unique password that is not a common dictionary or numeric pattern.",
          ["noCommonPassword"],
        );
        break;
      case "entropyAtLeast":
        addSuggestion(
          "entropyAtLeast",
          `Increase length and variety to raise entropy above ${config.policy.entropyAtLeast?.entropyMinBits ?? "the configured threshold"}.`,
          ["entropyAtLeast"],
        );
        break;
      case "confirmMatches":
        addSuggestion("confirmMatches", "Ensure the confirmation matches the password exactly.", ["confirmMatches"]);
        break;
      default:
        // no-op
        break;
    }
  }

  // If everything passed, provide a small positive info suggestion.
  if (suggestions.length === 0) {
    suggestions.push({
      id: "allPassed",
      text: "Nice. This password satisfies all enabled validation rules.",
      severity: "info",
      relatedRuleIds: config.enabledRuleIds,
    });
  }

  return { warnings, suggestions };
}

