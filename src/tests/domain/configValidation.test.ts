import { validatePasswordAnalysisConfig } from "../../domain/password/services/configValidation";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { PasswordAnalysisConfig } from "../../domain/password/models";

describe("validatePasswordAnalysisConfig", () => {
  test("valid default configuration returns null", () => {
    expect(validatePasswordAnalysisConfig(createDefaultPasswordAnalysisConfig())).toBeNull();
  });

  test("invalid: empty enabledRuleIds", () => {
    const cfg = {
      ...createDefaultPasswordAnalysisConfig(),
      enabledRuleIds: [],
    };
    const err = validatePasswordAnalysisConfig(cfg as unknown as PasswordAnalysisConfig);
    expect(err?.state).toBe("error");
    expect(err?.details?.fieldErrors?.some((e) => e.path === "enabledRuleIds")).toBe(true);
  });

  test("invalid: minLength > maxLength", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const cfg = {
      ...base,
      policy: { ...base.policy, minLength: 10, maxLength: 9 },
    };
    const err = validatePasswordAnalysisConfig(cfg);
    expect(err?.state).toBe("error");
    expect(err?.details?.fieldErrors?.some((e) => e.message.includes("minLength"))).toBe(true);
  });

  test("invalid: strength thresholds not ordered weakMax < veryWeakMax", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const cfg = {
      ...base,
      strength: { thresholds: { veryWeakMax: 50, weakMax: 40, mediumMax: 69 } },
    };
    const err = validatePasswordAnalysisConfig(cfg);
    expect(err?.state).toBe("error");
  });

  test("invalid: scoring.clamp.min >= clamp.max", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const cfg = {
      ...base,
      scoring: { ...base.scoring, clamp: { min: 10, max: 10 } },
    };
    const err = validatePasswordAnalysisConfig(cfg);
    expect(err?.state).toBe("error");
  });

  test("invalid: hardFailRuleIds empty array", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const cfg = {
      ...base,
      passFail: { ...base.passFail, hardFailRuleIds: [] },
    };
    const err = validatePasswordAnalysisConfig(cfg);
    expect(err?.state).toBe("error");
  });

  describe("minimumRulesPassedCount when passRequiresAllEnabledRules is false", () => {
    test("invalid when minimumRulesPassedCount is negative", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const cfg = {
        ...base,
        passFail: {
          passRequiresAllEnabledRules: false,
          minimumRulesPassedCount: -1,
          hardFailRuleIds: ["maxLength"],
        },
      };
      const err = validatePasswordAnalysisConfig(cfg);
      expect(err?.state).toBe("error");
    });

    test("invalid when minimumRulesPassedCount is not a number", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const cfg = {
        ...base,
        passFail: {
          passRequiresAllEnabledRules: false,
          minimumRulesPassedCount: "7" as unknown as number,
          hardFailRuleIds: ["maxLength"],
        },
      };
      const err = validatePasswordAnalysisConfig(cfg);
      expect(err?.state).toBe("error");
    });

    test("valid when zero", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const cfg = {
        ...base,
        passFail: {
          passRequiresAllEnabledRules: false,
          minimumRulesPassedCount: 0,
          hardFailRuleIds: ["maxLength"],
        },
      };
      expect(validatePasswordAnalysisConfig(cfg)).toBeNull();
    });
  });

  /**
   * MCDC-style: compound condition for minimumRulesPassedCount is only enforced when
   * passRequiresAllEnabledRules === false (see configValidation.ts).
   */
  describe("MCDC: passRequiresAllEnabledRules vs minimumRulesPassedCount", () => {
    test("when passRequiresAllEnabledRules is true, invalid minimumRulesPassedCount is ignored", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const cfg = {
        ...base,
        passFail: {
          passRequiresAllEnabledRules: true,
          minimumRulesPassedCount: -99,
          hardFailRuleIds: ["maxLength"],
        },
      };
      expect(validatePasswordAnalysisConfig(cfg)).toBeNull();
    });

    test("when passRequiresAllEnabledRules is false and minimum is valid number >=0, config valid", () => {
      const base = createDefaultPasswordAnalysisConfig();
      const cfg = {
        ...base,
        passFail: {
          passRequiresAllEnabledRules: false,
          minimumRulesPassedCount: 3,
          hardFailRuleIds: ["maxLength"],
        },
      };
      expect(validatePasswordAnalysisConfig(cfg)).toBeNull();
    });
  });
});
