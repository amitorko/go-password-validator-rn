import { evaluatePasswordRules } from "../../domain/password/rules/PasswordRulesEngine";
import { CommonPasswordService } from "../../domain/password/services/CommonPasswordService";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";

describe("noRepeatedSequences rule", () => {
  test("overlapping counts can fail while non-overlapping passes", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const common = new CommonPasswordService();

    const enabledConfig = {
      ...base,
      enabledRuleIds: ["noRepeatedSequences"] as const,
      policy: {
        ...base.policy,
        noRepeatedSequences: {
          minSeqLen: 2,
          maxSeqCount: 2,
          allowOverlapping: true,
        },
      },
    };

    const overlapping = evaluatePasswordRules(
      { password: "aaaa" }, // overlapping 2-char substrings: "aa","aa","aa" -> count 3
      enabledConfig,
      { commonPasswordService: common },
    );
    expect(overlapping[0].ruleId).toBe("noRepeatedSequences");
    expect(overlapping[0].passed).toBe(false);

    const nonOverlappingConfig = {
      ...enabledConfig,
      policy: {
        ...enabledConfig.policy,
        noRepeatedSequences: {
          ...enabledConfig.policy.noRepeatedSequences,
          allowOverlapping: false,
        },
      },
    };

    const nonOverlapping = evaluatePasswordRules(
      { password: "aaaa" }, // non-overlapping step=2 substrings: "aa","aa" -> count 2
      nonOverlappingConfig,
      { commonPasswordService: common },
    );
    expect(nonOverlapping[0].passed).toBe(true);
  });
});

