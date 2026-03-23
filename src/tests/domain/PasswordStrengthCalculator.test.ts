import { calculatePasswordStrength } from "../../domain/password/scoring/PasswordStrengthCalculator";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { RuleResult } from "../../domain/password/models";

function makeRuleResult(ruleId: "minLength", passed: boolean, evidence: string[]): RuleResult {
  return { ruleId, passed, evidence };
}

describe("PasswordStrengthCalculator", () => {
  test.each([
    { score: 10, expected: "Very Weak" as const },
    { score: 20, expected: "Weak" as const },
    { score: 30, expected: "Medium" as const },
    { score: 31, expected: "Strong" as const },
  ])("classifies score=$score correctly", ({ score, expected }) => {
    const base = createDefaultPasswordAnalysisConfig();
    const config = {
      ...base,
      strength: { thresholds: { veryWeakMax: 10, weakMax: 20, mediumMax: 30 } },
      scoring: {
        ...base.scoring,
        clamp: { min: 0, max: 100 },
        perRule: {
          minLength: { pointsForPass: score },
        },
      },
    };

    const results: RuleResult[] = [makeRuleResult("minLength", true, ["ok"])];
    const strength = calculatePasswordStrength(results, config);
    expect(strength.score).toBe(score);
    expect(strength.category).toBe(expected);
  });
});

