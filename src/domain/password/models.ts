export const RuleIds = [
  "minLength",
  "maxLength",
  "hasUppercase",
  "hasLowercase",
  "hasNumber",
  "hasSpecial",
  "noSpaces",
  "noRepeatedSequences",
  "noCommonPassword",
  "entropyAtLeast",
  "confirmMatches",
] as const;

export type RuleId = (typeof RuleIds)[number];

export type StrengthCategory = "Very Weak" | "Weak" | "Medium" | "Strong";

export type PasswordInput = {
  password: string;
  confirmPassword?: string;
};

export type SuggestionSeverity = "info" | "warning";

export interface SuggestionItem {
  id: string;
  text: string;
  severity: SuggestionSeverity;
  relatedRuleIds?: RuleId[];
}

export interface RuleResult {
  ruleId: RuleId;
  passed: boolean;
  evidence: string[];
  /**
   * Structured evidence used by tests/UI.
   * Keep it JSON-serializable and stable.
   */
  details?: Record<string, unknown>;
}

export interface StrengthReport {
  score: number; // 0..100, clamped
  category: StrengthCategory;
  breakdown?: Partial<Record<string, number>>;
}

export interface PassFailCriteriaResult {
  passed: boolean;
  hardFailures: RuleId[];
  enabledRulesCount: number;
  enabledPassedRulesCount: number;
  reason: string;
}

export interface PasswordAnalysisReport {
  state: "success";
  results: RuleResult[];
  strength: StrengthReport;
  passStatus: PassFailCriteriaResult;
  warnings: string[];
  suggestions: SuggestionItem[];
}

export interface InvalidRulesConfigDetails {
  message: string;
  fieldErrors?: Array<{ path: string; message: string }>;
}

export interface InvalidRulesConfigError {
  state: "error";
  name: "InvalidRulesConfigError";
  message: string;
  details?: InvalidRulesConfigDetails;
}

export type AnalysisOutcome = PasswordAnalysisReport | InvalidRulesConfigError;

export interface PassFailCriteria {
  passRequiresAllEnabledRules: boolean;
  minimumRulesPassedCount?: number;
  hardFailRuleIds: RuleId[];
}

export interface StrengthThresholds {
  veryWeakMax: number;
  weakMax: number;
  mediumMax: number;
}

export interface StrengthConfig {
  thresholds: StrengthThresholds;
}

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;

  uppercaseRegex: string;
  lowercaseRegex: string;
  numberRegex: string;
  /**
   * Special characters regex.
   * Note: used as source for `new RegExp(specialRegex, "u")` by the engine.
   */
  specialRegex: string;

  disallowWhitespace: boolean;

  noRepeatedSequences: {
    minSeqLen: number;
    maxSeqCount: number;
    /**
     * If true, allow overlapping substring counts.
     * Default: overlapping counts enabled (more strict).
     */
    allowOverlapping: boolean;
  };

  /**
   * If enabled, an heuristic estimate of entropy must be >= `entropyMinBits`.
   */
  entropyAtLeast?: {
    entropyMinBits: number;
  };

  /**
   * If true, a confirm password input is required for validation success.
   */
  requireConfirmMatch: boolean;
}

export interface ScoringRuleConfig {
  pointsForPass?: number;
  penaltyForFail?: number;
  /**
   * If true, failing this rule forces a hard failure.
   * (Hard failures are also configurable via PassFailCriteria.)
   */
  isHardFail?: boolean;
}

export interface PasswordScoringConfig {
  /**
   * Points and penalties per rule id.
   * Missing entries default to 0 points for pass and 0 penalty for fail.
   */
  perRule: Partial<Record<RuleId, ScoringRuleConfig>>;
  /**
   * Final score clamping.
   */
  clamp: { min: number; max: number };
}

export interface PasswordAnalysisConfig {
  enabledRuleIds: RuleId[];
  policy: PasswordPolicyConfig;
  passFail: PassFailCriteria;
  strength: StrengthConfig;
  scoring: PasswordScoringConfig;
}

