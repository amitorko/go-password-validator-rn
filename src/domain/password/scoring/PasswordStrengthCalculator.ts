import type { PasswordAnalysisConfig, RuleResult, StrengthReport, RuleId } from "../models";

const DEFAULT_RULE_POINTS: Partial<Record<RuleId, number>> = {
  minLength: 20,
  hasUppercase: 15,
  hasLowercase: 15,
  hasNumber: 15,
  hasSpecial: 15,
  entropyAtLeast: 10,
  confirmMatches: 5,
};

const DEFAULT_RULE_PENALTIES: Partial<Record<RuleId, number>> = {
  maxLength: -40,
  noSpaces: -10,
  noRepeatedSequences: -15,
  noCommonPassword: -25,
  entropyAtLeast: -10,
  // confirmMatches when enabled but mismatched:
  confirmMatches: -10,
  // For other failures (e.g., missing uppercase), we keep penalty modest:
  hasUppercase: -5,
  hasLowercase: -5,
  hasNumber: -5,
  hasSpecial: -5,
};

export function calculatePasswordStrength(
  results: RuleResult[],
  config: PasswordAnalysisConfig,
): StrengthReport {
  let score = 0;
  const breakdown: Record<string, number> = {};

  const perRule = config.scoring.perRule ?? {};

  for (const r of results) {
    const scoring = perRule[r.ruleId];

    const pointsForPass =
      scoring?.pointsForPass ??
      (r.passed ? DEFAULT_RULE_POINTS[r.ruleId] : undefined) ??
      0;

    const penaltyForFail =
      scoring?.penaltyForFail ??
      (!r.passed ? DEFAULT_RULE_PENALTIES[r.ruleId] : undefined) ??
      0;

    const delta = r.passed ? pointsForPass : penaltyForFail;
    score += delta;
    breakdown[r.ruleId] = (breakdown[r.ruleId] ?? 0) + delta;
  }

  const clamped = clamp(score, config.scoring.clamp.min, config.scoring.clamp.max);
  const category = classify(clamped, config.strength.thresholds);

  return {
    score: clamped,
    category,
    breakdown,
  };
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v) || !Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function classify(score: number, th: PasswordAnalysisConfig["strength"]["thresholds"]) {
  if (score <= th.veryWeakMax) return "Very Weak";
  if (score <= th.weakMax) return "Weak";
  if (score <= th.mediumMax) return "Medium";
  return "Strong";
}

