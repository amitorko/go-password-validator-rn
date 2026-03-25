import { calculatePasswordStrength } from "../../domain/password/scoring/PasswordStrengthCalculator";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { RuleId, RuleResult } from "../../domain/password/models";

function makeRule(ruleId: RuleId, passed: boolean, evidence: string[] = ["x"]): RuleResult {
  return { ruleId, passed, evidence };
}

function configWithSingleRuleScore(
  score: number,
  thresholds = { veryWeakMax: 24, weakMax: 49, mediumMax: 69 },
) {
  const base = createDefaultPasswordAnalysisConfig();
  return {
    ...base,
    strength: { thresholds },
    scoring: {
      ...base.scoring,
      clamp: { min: 0, max: 100 },
      perRule: {
        minLength: { pointsForPass: score },
      },
    },
  };
}

describe("PasswordStrengthCalculator", () => {
  describe("classification at default strength thresholds (24 / 49 / 69)", () => {
    const cases: Array<{ score: number; category: string }> = [
      { score: 24, category: "Very Weak" },
      { score: 25, category: "Weak" },
      { score: 49, category: "Weak" },
      { score: 50, category: "Medium" },
      { score: 69, category: "Medium" },
      { score: 70, category: "Strong" },
    ];

    test.each(cases)("score $score -> $category", ({ score, category }) => {
      const config = configWithSingleRuleScore(score);
      const strength = calculatePasswordStrength([makeRule("minLength", true)], config);
      expect(strength.score).toBe(score);
      expect(strength.category).toBe(category);
    });
  });

  describe("score clamping", () => {
    test("clamps raw score below min to clamp.min", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = {
        ...base,
        scoring: {
          ...base.scoring,
          clamp: { min: 0, max: 100 },
          perRule: {
            minLength: { penaltyForFail: -500 },
          },
        },
      };
      const strength = calculatePasswordStrength([makeRule("minLength", false)], config);
      expect(strength.score).toBe(0);
    });

    test("clamps raw score above max to clamp.max", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = {
        ...base,
        scoring: {
          ...base.scoring,
          clamp: { min: 0, max: 100 },
          perRule: {
            minLength: { pointsForPass: 500 },
          },
        },
      };
      const strength = calculatePasswordStrength([makeRule("minLength", true)], config);
      expect(strength.score).toBe(100);
    });
  });

  describe("representative pass/fail scoring", () => {
    test("passing minLength adds default points from implementation", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = { ...base, scoring: { ...base.scoring, perRule: {} } };
      const strength = calculatePasswordStrength([makeRule("minLength", true)], config);
      expect(strength.breakdown?.minLength).toBe(20);
    });

    test("failing hasUppercase applies default penalty", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = { ...base, scoring: { ...base.scoring, perRule: {} } };
      const strength = calculatePasswordStrength([makeRule("hasUppercase", false)], config);
      expect(strength.breakdown?.hasUppercase).toBe(-5);
    });
  });

  describe("mutation-resistant: threshold boundaries", () => {
    test("24 is Very Weak, not Weak (<= veryWeakMax)", () => {
      const config = configWithSingleRuleScore(24);
      expect(calculatePasswordStrength([makeRule("minLength", true)], config).category).toBe("Very Weak");
    });

    test("25 is Weak (strictly greater than veryWeakMax)", () => {
      const config = configWithSingleRuleScore(25);
      expect(calculatePasswordStrength([makeRule("minLength", true)], config).category).toBe("Weak");
    });

    test("49 remains Weak (<= weakMax)", () => {
      const config = configWithSingleRuleScore(49);
      expect(calculatePasswordStrength([makeRule("minLength", true)], config).category).toBe("Weak");
    });

    test("50 is Medium", () => {
      const config = configWithSingleRuleScore(50);
      expect(calculatePasswordStrength([makeRule("minLength", true)], config).category).toBe("Medium");
    });

    test("69 is Medium", () => {
      const config = configWithSingleRuleScore(69);
      expect(calculatePasswordStrength([makeRule("minLength", true)], config).category).toBe("Medium");
    });

    test("70 is Strong", () => {
      const config = configWithSingleRuleScore(70);
      expect(calculatePasswordStrength([makeRule("minLength", true)], config).category).toBe("Strong");
    });
  });

  describe("mutation-resistant: minLength boundary (>= vs >)", () => {
    test("default minLength scoring still 20 points when rule passes", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = { ...base, scoring: { ...base.scoring, perRule: {} } };
      const s = calculatePasswordStrength([makeRule("minLength", true)], config);
      expect(s.breakdown?.minLength).toBe(20);
    });
  });
});
