import { analyzePassword } from "../../domain/password/PasswordValidator";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";

describe("PasswordValidator pass/fail", () => {
  test("hard-fail rule failure forces overall FAIL", () => {
    const base = createDefaultPasswordAnalysisConfig();

    const config = {
      ...base,
      enabledRuleIds: ["noCommonPassword"] as const,
      passFail: {
        passRequiresAllEnabledRules: false,
        minimumRulesPassedCount: 1,
        hardFailRuleIds: ["noCommonPassword"],
      },
      // scoring config only used for strength; keep defaults.
    };

    const outcome = analyzePassword({ password: "password" }, config);
    expect(outcome.state).toBe("success");
    if (outcome.state === "success") {
      expect(outcome.passStatus.passed).toBe(false);
      expect(outcome.passStatus.hardFailures).toContain("noCommonPassword");
    }
  });
});

