import { generateSuggestions } from "../../domain/password/suggestions/SuggestionGenerator";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { RuleResult, RuleId } from "../../domain/password/models";

function makeResult(ruleId: RuleId, passed: boolean): RuleResult {
  return { ruleId, passed, evidence: [] };
}

describe("generateSuggestions", () => {
  const base = createDefaultPasswordAnalysisConfig();

  test("when one rule fails, emits warning and rule-specific suggestion", () => {
    const config = { ...base, enabledRuleIds: ["minLength"] as RuleId[] };
    const results: RuleResult[] = [makeResult("minLength", false)];
    const out = generateSuggestions(results, config);
    expect(out.warnings.length).toBeGreaterThan(0);
    expect(out.warnings[0]).toContain(String(config.policy.minLength));
    expect(out.suggestions.some((s) => s.id === "minLength")).toBe(true);
  });

  test("when multiple rules fail, produces multiple suggestions (unique ids)", () => {
    const config = {
      ...base,
      enabledRuleIds: ["hasUppercase", "hasNumber"] as RuleId[],
    };
    const results: RuleResult[] = [makeResult("hasUppercase", false), makeResult("hasNumber", false)];
    const out = generateSuggestions(results, config);
    const ids = new Set(out.suggestions.map((s) => s.id));
    expect(ids.has("hasUppercase")).toBe(true);
    expect(ids.has("hasNumber")).toBe(true);
  });

  test("does not suggest for rules that passed", () => {
    const config = {
      ...base,
      enabledRuleIds: ["hasUppercase", "hasLowercase"] as RuleId[],
    };
    const results: RuleResult[] = [makeResult("hasUppercase", true), makeResult("hasLowercase", false)];
    const out = generateSuggestions(results, config);
    expect(out.suggestions.every((s) => s.id !== "hasUppercase")).toBe(true);
    expect(out.suggestions.some((s) => s.id === "hasLowercase")).toBe(true);
  });

  test("when all enabled rules pass, includes allPassed info suggestion", () => {
    const config = {
      ...base,
      enabledRuleIds: ["minLength", "hasUppercase"] as RuleId[],
    };
    const results: RuleResult[] = [makeResult("minLength", true), makeResult("hasUppercase", true)];
    const out = generateSuggestions(results, config);
    expect(out.suggestions.some((s) => s.id === "allPassed" && s.severity === "info")).toBe(true);
    expect(out.warnings).toHaveLength(0);
  });
});
