import { evaluatePasswordRules } from "../../domain/password/rules/PasswordRulesEngine";
import {
  evalConfirmMatches,
  evalEntropyAtLeast,
  evalHasLowercase,
  evalHasNumber,
  evalHasSpecial,
  evalHasUppercase,
  evalMaxLength,
  evalMinLength,
  evalNoCommonPassword,
  evalNoRepeatedSequences,
  evalNoSpaces,
} from "../../domain/password/rules/individualRules";
import { CommonPasswordService } from "../../domain/password/services/CommonPasswordService";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { PasswordAnalysisConfig, PasswordPolicyConfig } from "../../domain/password/models";

const common = new CommonPasswordService();

function policy(overrides: Partial<PasswordPolicyConfig>): PasswordPolicyConfig {
  return { ...createDefaultPasswordAnalysisConfig().policy, ...overrides };
}

function ctx(
  password: string,
  policyOverrides: Partial<PasswordPolicyConfig>,
  confirm?: string,
) {
  return {
    password,
    confirmPassword: confirm,
    policy: policy(policyOverrides),
    commonPasswordService: common,
  };
}

describe("individualRules", () => {
  describe("evalMinLength", () => {
    test("below boundary: length minLength-1 fails", () => {
      const r = evalMinLength(ctx("123456789", { minLength: 10 }));
      expect(r.passed).toBe(false);
      expect(r.evidence[0]).toMatch(/</);
    });

    test("at boundary: length equals minLength passes", () => {
      const r = evalMinLength(ctx("1234567890", { minLength: 10 }));
      expect(r.passed).toBe(true);
    });

    test("above boundary: longer password passes", () => {
      const r = evalMinLength(ctx("12345678901", { minLength: 10 }));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalMaxLength", () => {
    test("below boundary: under max passes", () => {
      const r = evalMaxLength(ctx("a".repeat(128), { maxLength: 128 }));
      expect(r.passed).toBe(true);
    });

    test("at boundary: length equals maxLength passes", () => {
      const r = evalMaxLength(ctx("a".repeat(128), { maxLength: 128 }));
      expect(r.passed).toBe(true);
    });

    test("above boundary: maxLength+1 fails", () => {
      const r = evalMaxLength(ctx("a".repeat(129), { maxLength: 128 }));
      expect(r.passed).toBe(false);
    });
  });

  describe("evalHasUppercase", () => {
    test("invalid class: no uppercase fails", () => {
      const r = evalHasUppercase(ctx("abcdefgh!!", {}));
      expect(r.passed).toBe(false);
    });

    test("valid class: at least one uppercase passes", () => {
      const r = evalHasUppercase(ctx("Abcdefgh!!", {}));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalHasLowercase", () => {
    test("invalid class: no lowercase fails", () => {
      const r = evalHasLowercase(ctx("ABCDEFGH!!", {}));
      expect(r.passed).toBe(false);
    });

    test("valid class: at least one lowercase passes", () => {
      const r = evalHasLowercase(ctx("Abcdefgh!!", {}));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalHasNumber", () => {
    test("invalid class: no digit fails", () => {
      const r = evalHasNumber(ctx("Abcdefgh!!", {}));
      expect(r.passed).toBe(false);
    });

    test("valid class: digit passes", () => {
      const r = evalHasNumber(ctx("Abcdefgh!1", {}));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalHasSpecial", () => {
    test("invalid class: only letters and digits fails", () => {
      const r = evalHasSpecial(ctx("Abcdefgh12", {}));
      expect(r.passed).toBe(false);
    });

    test("valid class: punctuation passes", () => {
      const r = evalHasSpecial(ctx("Abcdefgh!1", {}));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalNoSpaces", () => {
    test("when disallowWhitespace false, always passes", () => {
      const r = evalNoSpaces(ctx("a b", { disallowWhitespace: false }));
      expect(r.passed).toBe(true);
    });

    test("when disallowWhitespace true, whitespace fails", () => {
      const r = evalNoSpaces(ctx("ab c", { disallowWhitespace: true }));
      expect(r.passed).toBe(false);
    });

    test("when disallowWhitespace true, no whitespace passes", () => {
      const r = evalNoSpaces(ctx("abc", { disallowWhitespace: true }));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalNoCommonPassword", () => {
    test("common password fails", () => {
      const r = evalNoCommonPassword(ctx("password", {}));
      expect(r.passed).toBe(false);
    });

    test("trimmed normalization: leading/trailing spaces still common", () => {
      const r = evalNoCommonPassword(ctx("  password  ", {}));
      expect(r.passed).toBe(false);
    });

    test("non-listed password passes", () => {
      const r = evalNoCommonPassword(ctx("Xk9#mP2!zQwUnique", {}));
      expect(r.passed).toBe(true);
    });
  });

  describe("evalNoRepeatedSequences", () => {
    test("password shorter than minSeqLen passes (vacuous)", () => {
      const r = evalNoRepeatedSequences(
        ctx("a", {
          noRepeatedSequences: { minSeqLen: 2, maxSeqCount: 2, allowOverlapping: true },
        }),
      );
      expect(r.passed).toBe(true);
    });

    test("at boundary: maxObservedCount equals maxSeqCount passes", () => {
      const r = evalNoRepeatedSequences(
        ctx("abab", {
          noRepeatedSequences: { minSeqLen: 2, maxSeqCount: 2, allowOverlapping: false },
        }),
      );
      expect(r.passed).toBe(true);
    });

    test("above boundary: too many repeats fails", () => {
      const r = evalNoRepeatedSequences(
        ctx("aaaa", {
          noRepeatedSequences: { minSeqLen: 2, maxSeqCount: 2, allowOverlapping: true },
        }),
      );
      expect(r.passed).toBe(false);
    });
  });

  describe("evalEntropyAtLeast", () => {
    test("when entropyAtLeast missing in policy, fails with evidence", () => {
      const base = createDefaultPasswordAnalysisConfig().policy;
      const { entropyAtLeast: _drop, ...rest } = base;
      const r = evalEntropyAtLeast({
        password: "abc",
        policy: rest as PasswordPolicyConfig,
        commonPasswordService: common,
      });
      expect(r.passed).toBe(false);
      expect(r.evidence[0]).toMatch(/missing/);
    });

    test("below threshold: entropy bits < entropyMinBits fails", () => {
      const r = evalEntropyAtLeast(
        ctx("1234567891", {
          entropyAtLeast: { entropyMinBits: 35 },
        }),
      );
      expect(r.passed).toBe(false);
    });

    test("at/above threshold: long varied password passes", () => {
      const r = evalEntropyAtLeast(
        ctx("Abcdefgh!1Extra", {
          entropyAtLeast: { entropyMinBits: 35 },
        }),
      );
      expect(r.passed).toBe(true);
    });
  });

  describe("evalConfirmMatches", () => {
    test("when requireConfirmMatch false, passes without confirm", () => {
      const r = evalConfirmMatches(ctx("secret", { requireConfirmMatch: false }));
      expect(r.passed).toBe(true);
    });

    test("when requireConfirmMatch true and confirm empty, fails", () => {
      const r = evalConfirmMatches(ctx("secret", { requireConfirmMatch: true }, ""));
      expect(r.passed).toBe(false);
    });

    test("when requireConfirmMatch true and confirm matches password, passes", () => {
      const r = evalConfirmMatches(ctx("Secret1!", { requireConfirmMatch: true }, "Secret1!"));
      expect(r.passed).toBe(true);
    });

    test("when requireConfirmMatch true and confirm differs, fails", () => {
      const r = evalConfirmMatches(ctx("Secret1!", { requireConfirmMatch: true }, "Secret1@"));
      expect(r.passed).toBe(false);
    });
  });
});

describe("evaluatePasswordRules integration (single rule configs)", () => {
  test("enabledRuleIds order is preserved in results", () => {
    const base = createDefaultPasswordAnalysisConfig();
    const config: PasswordAnalysisConfig = {
      ...base,
      enabledRuleIds: ["hasNumber", "minLength"],
    };
    const results = evaluatePasswordRules({ password: "1" }, config, { commonPasswordService: common });
    expect(results.map((r) => r.ruleId)).toEqual(["hasNumber", "minLength"]);
  });
});
