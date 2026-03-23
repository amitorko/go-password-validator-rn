import type { PasswordAnalysisConfig, PasswordInput, RuleResult } from "../models";
import { ruleEvaluators, type RuleEvaluationContext } from "./individualRules";
import { CommonPasswordService } from "../services/CommonPasswordService";

export type PasswordRulesEngineDeps = {
  commonPasswordService: CommonPasswordService;
};

export function evaluatePasswordRules(
  input: PasswordInput,
  config: PasswordAnalysisConfig,
  deps: PasswordRulesEngineDeps,
): RuleResult[] {
  const ctxBase: Omit<RuleEvaluationContext, "commonPasswordService"> = {
    password: input.password,
    confirmPassword: input.confirmPassword,
    policy: config.policy,
  };

  const results: RuleResult[] = [];
  for (const ruleId of config.enabledRuleIds) {
    const evaluator = ruleEvaluators[ruleId];
    // If config passes validation, evaluator should always exist.
    const ctx: RuleEvaluationContext = {
      ...ctxBase,
      commonPasswordService: deps.commonPasswordService,
    };
    results.push(evaluator(ctx));
  }
  return results;
}

