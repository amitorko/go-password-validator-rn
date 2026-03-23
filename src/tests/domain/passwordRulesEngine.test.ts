import { evaluatePasswordRules } from "../../domain/password/rules/PasswordRulesEngine";
import { CommonPasswordService } from "../../domain/password/services/CommonPasswordService";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";

describe("PasswordRulesEngine", () => {
  test("minLength boundary: exactly min passes, min-1 fails", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const common = new CommonPasswordService();

    const config = {
      ...base,
      enabledRuleIds: ["minLength"] as const,
      policy: { ...base.policy, minLength: 10, maxLength: 128 },
    };

    const resultsFail = evaluatePasswordRules(
      { password: "123456789" }, // 9 chars
      config,
      { commonPasswordService: common },
    );
    expect(resultsFail).toHaveLength(1);
    expect(resultsFail[0].ruleId).toBe("minLength");
    expect(resultsFail[0].passed).toBe(false);

    const resultsPass = evaluatePasswordRules(
      { password: "1234567890" }, // 10 chars
      config,
      { commonPasswordService: common },
    );
    expect(resultsPass[0].passed).toBe(true);
  });
});

