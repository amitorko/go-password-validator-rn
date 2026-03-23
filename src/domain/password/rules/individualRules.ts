import type { CommonPasswordService } from "../services/CommonPasswordService";
import type {
  PasswordPolicyConfig,
  RuleResult,
  RuleId,
} from "../models";

export type RuleEvaluationContext = {
  password: string;
  confirmPassword?: string;
  policy: PasswordPolicyConfig;
  commonPasswordService: CommonPasswordService;
};

function compileRegex(source: string): RegExp {
  // Engine assumes `source` is a regex source (not including `/.../flags`).
  return new RegExp(source, "u");
}

function hasRegexMatch(source: string, value: string): boolean {
  return compileRegex(source).test(value);
}

export function evalMinLength(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const passed = password.length >= policy.minLength;
  if (passed) {
    return {
      ruleId: "minLength",
      passed,
      evidence: [`length ${password.length} >= ${policy.minLength}`],
      details: { length: password.length, minLength: policy.minLength },
    };
  }
  return {
    ruleId: "minLength",
    passed,
    evidence: [`length ${password.length} < ${policy.minLength}`],
    details: { length: password.length, minLength: policy.minLength },
  };
}

export function evalMaxLength(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const passed = password.length <= policy.maxLength;
  if (passed) {
    return {
      ruleId: "maxLength",
      passed,
      evidence: [`length ${password.length} <= ${policy.maxLength}`],
      details: { length: password.length, maxLength: policy.maxLength },
    };
  }
  return {
    ruleId: "maxLength",
    passed,
    evidence: [`length ${password.length} > ${policy.maxLength}`],
    details: { length: password.length, maxLength: policy.maxLength },
  };
}

export function evalHasUppercase(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const passed = hasRegexMatch(policy.uppercaseRegex, password);
  return {
    ruleId: "hasUppercase",
    passed,
    evidence: passed ? ["uppercase regex matched"] : ["uppercase regex did not match"],
    details: { regex: policy.uppercaseRegex },
  };
}

export function evalHasLowercase(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const passed = hasRegexMatch(policy.lowercaseRegex, password);
  return {
    ruleId: "hasLowercase",
    passed,
    evidence: passed ? ["lowercase regex matched"] : ["lowercase regex did not match"],
    details: { regex: policy.lowercaseRegex },
  };
}

export function evalHasNumber(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const passed = hasRegexMatch(policy.numberRegex, password);
  return {
    ruleId: "hasNumber",
    passed,
    evidence: passed ? ["number regex matched"] : ["number regex did not match"],
    details: { regex: policy.numberRegex },
  };
}

export function evalHasSpecial(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const passed = hasRegexMatch(policy.specialRegex, password);
  return {
    ruleId: "hasSpecial",
    passed,
    evidence: passed ? ["special regex matched"] : ["special regex did not match"],
    details: { regex: policy.specialRegex },
  };
}

export function evalNoSpaces(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  if (!policy.disallowWhitespace) {
    return {
      ruleId: "noSpaces",
      passed: true,
      evidence: ["whitespace disallow is off in policy"],
    };
  }

  const match = password.match(/\s/u);
  const passed = match == null;
  if (passed) {
    return {
      ruleId: "noSpaces",
      passed,
      evidence: ["no whitespace characters found"],
    };
  }

  const found = match?.[0] ?? "<unknown>";
  return {
    ruleId: "noSpaces",
    passed,
    evidence: [`found whitespace character '${found}'`],
    details: { found },
  };
}

export function evalNoRepeatedSequences(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  const { minSeqLen, maxSeqCount, allowOverlapping } = policy.noRepeatedSequences;

  if (password.length < minSeqLen) {
    return {
      ruleId: "noRepeatedSequences",
      passed: true,
      evidence: [`password length ${password.length} < minSeqLen ${minSeqLen}; no sequences to repeat`],
      details: { passwordLength: password.length, minSeqLen, maxSeqCount },
    };
  }

  const counts = new Map<string, number>();
  const step = allowOverlapping ? 1 : minSeqLen;
  for (let i = 0; i + minSeqLen <= password.length; i += step) {
    const sub = password.slice(i, i + minSeqLen);
    counts.set(sub, (counts.get(sub) ?? 0) + 1);
  }

  let maxObservedCount = 0;
  let worstSub = "";
  for (const [sub, c] of counts.entries()) {
    if (c > maxObservedCount) {
      maxObservedCount = c;
      worstSub = sub;
    }
  }

  const passed = maxObservedCount <= maxSeqCount;
  if (passed) {
    return {
      ruleId: "noRepeatedSequences",
      passed,
      evidence: [`max repeated sequence count ${maxObservedCount} <= ${maxSeqCount}`],
      details: { worstSub, maxObservedCount, maxSeqCount, minSeqLen },
    };
  }

  return {
    ruleId: "noRepeatedSequences",
    passed,
    evidence: [
      `repeated sequence '${worstSub}' occurs ${maxObservedCount} times > ${maxSeqCount}`,
    ],
    details: { worstSub, maxObservedCount, maxSeqCount, minSeqLen },
  };
}

export function evalNoCommonPassword(ctx: RuleEvaluationContext): RuleResult {
  const { password, commonPasswordService } = ctx;
  const { common, normalized } = commonPasswordService.isCommonPassword(password);

  if (common) {
    return {
      ruleId: "noCommonPassword",
      passed: false,
      evidence: [`matches common password '${normalized}'`],
      details: { normalized },
    };
  }

  return {
    ruleId: "noCommonPassword",
    passed: true,
    evidence: ["does not match common passwords list"],
    details: { normalized },
  };
}

export function evalEntropyAtLeast(ctx: RuleEvaluationContext): RuleResult {
  const { password, policy } = ctx;
  if (!policy.entropyAtLeast) {
    return {
      ruleId: "entropyAtLeast",
      passed: false,
      evidence: ["entropy rule enabled but policy.entropyAtLeast is missing"],
    };
  }

  const alphabetSize = estimateAlphabetSize(password, policy);
  const entropyBits = password.length * Math.log2(Math.max(1, alphabetSize));
  const passed = entropyBits >= policy.entropyAtLeast.entropyMinBits;

  if (passed) {
    return {
      ruleId: "entropyAtLeast",
      passed,
      evidence: [`entropy estimate ${entropyBits.toFixed(1)} >= ${policy.entropyAtLeast.entropyMinBits}`],
      details: { entropyBits, entropyMinBits: policy.entropyAtLeast.entropyMinBits, alphabetSize },
    };
  }

  return {
    ruleId: "entropyAtLeast",
    passed,
    evidence: [`entropy estimate ${entropyBits.toFixed(1)} < ${policy.entropyAtLeast.entropyMinBits}`],
    details: { entropyBits, entropyMinBits: policy.entropyAtLeast.entropyMinBits, alphabetSize },
  };
}

function estimateAlphabetSize(password: string, policy: PasswordPolicyConfig): number {
  // Deterministic heuristic based on which character classes appear.
  const upper = hasRegexMatch(policy.uppercaseRegex, password) ? 1 : 0;
  const lower = hasRegexMatch(policy.lowercaseRegex, password) ? 1 : 0;
  const num = hasRegexMatch(policy.numberRegex, password) ? 1 : 0;
  const special = hasRegexMatch(policy.specialRegex, password) ? 1 : 0;

  // Class sizes (roughly typical):
  // - upper: 26, lower: 26, digits: 10, special: 33
  return upper * 26 + lower * 26 + num * 10 + special * 33 || 1;
}

export function evalConfirmMatches(ctx: RuleEvaluationContext): RuleResult {
  const { password, confirmPassword, policy } = ctx;
  if (!policy.requireConfirmMatch) {
    return {
      ruleId: "confirmMatches",
      passed: true,
      evidence: ["confirm match is not required by policy"],
    };
  }

  if (confirmPassword == null || confirmPassword.length === 0) {
    return {
      ruleId: "confirmMatches",
      passed: false,
      evidence: ["confirm password is missing or empty"],
    };
  }

  const passed = confirmPassword === password;
  if (passed) {
    return {
      ruleId: "confirmMatches",
      passed,
      evidence: ["password and confirm password match"],
    };
  }

  return {
    ruleId: "confirmMatches",
    passed,
    evidence: ["password and confirm password do not match"],
    details: { confirmLength: confirmPassword.length, passwordLength: password.length },
  };
}

export const ruleEvaluators: Record<RuleId, (ctx: RuleEvaluationContext) => RuleResult> = {
  minLength: evalMinLength,
  maxLength: evalMaxLength,
  hasUppercase: evalHasUppercase,
  hasLowercase: evalHasLowercase,
  hasNumber: evalHasNumber,
  hasSpecial: evalHasSpecial,
  noSpaces: evalNoSpaces,
  noRepeatedSequences: evalNoRepeatedSequences,
  noCommonPassword: evalNoCommonPassword,
  entropyAtLeast: evalEntropyAtLeast,
  confirmMatches: evalConfirmMatches,
};

