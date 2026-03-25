import { analyzePassword } from "../../domain/password/PasswordValidator";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { PasswordAnalysisConfig } from "../../domain/password/models";

function makeConfig(overrides: Partial<PasswordAnalysisConfig>): PasswordAnalysisConfig {
  const base = createDefaultPasswordAnalysisConfig();
  return { ...base, ...overrides };
}

describe("analyzePassword", () => {
  describe("hard failures", () => {
    test("hard fail when maxLength rule fails", () => {
      const config = makeConfig({});
      const password = "a".repeat(129);
      const outcome = analyzePassword({ password }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.passed).toBe(false);
      expect(outcome.passStatus.hardFailures).toContain("maxLength");
      const maxLen = outcome.results.find((r) => r.ruleId === "maxLength");
      expect(maxLen?.passed).toBe(false);
    });

    test("hard fail when noCommonPassword rule fails", () => {
      const config = makeConfig({
        enabledRuleIds: ["minLength", "maxLength", "noCommonPassword"],
        policy: { ...createDefaultPasswordAnalysisConfig().policy, minLength: 8 },
        passFail: {
          passRequiresAllEnabledRules: false,
          minimumRulesPassedCount: 1,
          hardFailRuleIds: ["noCommonPassword"],
        },
      });
      const outcome = analyzePassword({ password: "password" }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.passed).toBe(false);
      expect(outcome.passStatus.hardFailures).toContain("noCommonPassword");
    });

    test("mutation-resistant: noCommonPassword failure still surfaces in hardFailures (default config)", () => {
      const outcome = analyzePassword({ password: "1234567890" }, makeConfig({}));
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.hardFailures).toContain("noCommonPassword");
    });
  });

  describe("minimumRulesPassedCount (default 7 of 10 enabled rules)", () => {
    test("FAIL when exactly 6 enabled rules pass (no hard fail)", () => {
      const config = makeConfig({});
      // 4 soft failures: no upper, lower, special, entropy — digits-only string; not in common list.
      const password = "1234567891";
      const outcome = analyzePassword({ password }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.enabledRulesCount).toBe(10);
      expect(outcome.passStatus.enabledPassedRulesCount).toBe(6);
      expect(outcome.passStatus.passed).toBe(false);
      expect(outcome.passStatus.hardFailures).toHaveLength(0);
    });

    test("PASS when exactly 7 enabled rules pass (no hard fail)", () => {
      const config = makeConfig({});
      const password = "abcdefghij";
      const outcome = analyzePassword({ password }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.enabledPassedRulesCount).toBe(7);
      expect(outcome.passStatus.passed).toBe(true);
      expect(outcome.passStatus.hardFailures).toHaveLength(0);
    });
  });

  describe("passRequiresAllEnabledRules", () => {
    test("when true, FAIL if any enabled rule fails", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = makeConfig({
        passFail: {
          passRequiresAllEnabledRules: true,
          minimumRulesPassedCount: 0,
          hardFailRuleIds: ["maxLength", "noCommonPassword"],
        },
        enabledRuleIds: ["minLength", "hasUppercase"],
        policy: { ...base.policy, minLength: 4 },
      });
      const outcome = analyzePassword({ password: "abcd" }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.enabledPassedRulesCount).toBe(1);
      expect(outcome.passStatus.passed).toBe(false);
      expect(outcome.passStatus.reason).toMatch(/Some enabled validation rules failed/);
    });

    test("when true, PASS only if every enabled rule passes", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const config = makeConfig({
        passFail: {
          passRequiresAllEnabledRules: true,
          minimumRulesPassedCount: 0,
          hardFailRuleIds: ["maxLength", "noCommonPassword"],
        },
        enabledRuleIds: ["minLength", "hasUppercase"],
        policy: { ...base.policy, minLength: 4 },
      });
      const outcome = analyzePassword({ password: "Abcd" }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.passStatus.passed).toBe(true);
    });
  });

  describe("invalid config", () => {
    test("returns InvalidRulesConfigError when config fails validatePasswordAnalysisConfig", () => {
      const bad = {
        ...createDefaultPasswordAnalysisConfig(),
        enabledRuleIds: [] as unknown as PasswordAnalysisConfig["enabledRuleIds"],
      };
      const outcome = analyzePassword({ password: "anything" }, bad);
      expect(outcome.state).toBe("error");
      if (outcome.state === "error") {
        expect(outcome.name).toBe("InvalidRulesConfigError");
      }
    });
  });

  describe("successful report shape", () => {
    test("returns strength, warnings, suggestions for valid config", () => {
      const config = makeConfig({});
      const outcome = analyzePassword({ password: "Abcdefgh!1" }, config);
      expect(outcome.state).toBe("success");
      if (outcome.state !== "success") return;
      expect(outcome.strength).toHaveProperty("score");
      expect(outcome.strength).toHaveProperty("category");
      expect(Array.isArray(outcome.warnings)).toBe(true);
      expect(Array.isArray(outcome.suggestions)).toBe(true);
    });
  });
});
