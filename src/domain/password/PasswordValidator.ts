import type {
  AnalysisOutcome,
  PasswordAnalysisConfig,
  PasswordInput,
  PassFailCriteriaResult,
  RuleId,
  PasswordAnalysisReport,
} from "./models";
import { CommonPasswordService } from "./services/CommonPasswordService";
import { evaluatePasswordRules } from "./rules/PasswordRulesEngine";
import { generateSuggestions } from "./suggestions/SuggestionGenerator";
import { calculatePasswordStrength } from "./scoring/PasswordStrengthCalculator";
import { validatePasswordAnalysisConfig } from "./services/configValidation";

export type PasswordValidatorDeps = {
  commonPasswordService?: CommonPasswordService;
};

export function analyzePassword(
  input: PasswordInput,
  config: PasswordAnalysisConfig,
  deps: PasswordValidatorDeps = {},
): AnalysisOutcome {
  const configError = validatePasswordAnalysisConfig(config);
  if (configError) return configError;

  const commonPasswordService = deps.commonPasswordService ?? new CommonPasswordService();

  const results = evaluatePasswordRules(input, config, { commonPasswordService });
  const passStatus = computePassStatus(results, config);
  const strength = calculatePasswordStrength(results, config);
  const { warnings, suggestions } = generateSuggestions(results, config);

  const report: PasswordAnalysisReport = {
    state: "success",
    results,
    strength,
    passStatus,
    warnings,
    suggestions,
  };

  return report;
}

function computePassStatus(results: Array<{ ruleId: RuleId; passed: boolean }>, config: PasswordAnalysisConfig): PassFailCriteriaResult {
  const hardFailures = results
    .filter((r) => config.passFail.hardFailRuleIds.includes(r.ruleId) && !r.passed)
    .map((r) => r.ruleId);

  const enabledRulesCount = config.enabledRuleIds.length;
  const enabledPassedRulesCount = results.filter((r) => r.passed).length;

  if (hardFailures.length > 0) {
    return {
      passed: false,
      hardFailures,
      enabledRulesCount,
      enabledPassedRulesCount,
      reason: `Hard-fail rule(s) failed: ${hardFailures.join(", ")}`,
    };
  }

  if (config.passFail.passRequiresAllEnabledRules) {
    const passed = enabledPassedRulesCount === enabledRulesCount;
    return {
      passed,
      hardFailures,
      enabledRulesCount,
      enabledPassedRulesCount,
      reason: passed
        ? "All enabled validation rules passed"
        : `Some enabled validation rules failed (${enabledPassedRulesCount}/${enabledRulesCount} passed)`,
    };
  }

  const min = config.passFail.minimumRulesPassedCount ?? 0;
  const passed = enabledPassedRulesCount >= min;
  return {
    passed,
    hardFailures,
    enabledRulesCount,
    enabledPassedRulesCount,
    reason: passed
      ? `Passed minimum rule count (${enabledPassedRulesCount} >= ${min})`
      : `Did not pass minimum rule count (${enabledPassedRulesCount} < ${min})`,
  };
}

