import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { PasswordAnalysisConfig } from "../../domain/password/models";
import { PasswordTestingScreen } from "../../screens/PasswordTestingScreen";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";

function makeConfig(overrides: Partial<PasswordAnalysisConfig>): PasswordAnalysisConfig {
  const base = createDefaultPasswordAnalysisConfig();
  return { ...base, ...overrides };
}

describe("Integration: validate flow", () => {
  test("typing a password and pressing validate produces results (FAIL expected)", () => {
    const config = makeConfig({
      // Keep defaults: includes hard-fail noCommonPassword.
      enabledRuleIds: [
        "minLength",
        "noCommonPassword",
        "hasUppercase",
        "hasLowercase",
        "hasNumber",
        "hasSpecial",
        "noSpaces",
        "noRepeatedSequences",
      ],
      passFail: {
        passRequiresAllEnabledRules: false,
        minimumRulesPassedCount: 1,
        hardFailRuleIds: ["noCommonPassword"],
      },
    });

    const onGoToResults = jest.fn();

    const { getByTestId } = render(
      <PasswordTestingScreen
        config={config}
        onGoToResults={onGoToResults}
        onGoToSettings={() => {}}
        onGoToWelcome={() => {}}
      />,
    );

    fireEvent.changeText(getByTestId("password-input"), "password");
    fireEvent.press(getByTestId("validate-button"));

    expect(onGoToResults).toHaveBeenCalledTimes(1);
    const report = onGoToResults.mock.calls[0][0];
    expect(report.passStatus.passed).toBe(false);
    expect(report.passStatus.hardFailures).toContain("noCommonPassword");
  });

  test("confirmMatches mismatch triggers FAIL when configured as hard-fail", () => {
    const config = makeConfig({
      enabledRuleIds: ["confirmMatches"],
      policy: {
        ...createDefaultPasswordAnalysisConfig().policy,
        requireConfirmMatch: true,
      },
      passFail: {
        passRequiresAllEnabledRules: true,
        minimumRulesPassedCount: 1,
        hardFailRuleIds: ["confirmMatches"],
      },
    });

    const onGoToResults = jest.fn();

    const { getByTestId } = render(
      <PasswordTestingScreen
        config={config}
        onGoToResults={onGoToResults}
        onGoToSettings={() => {}}
        onGoToWelcome={() => {}}
      />,
    );

    fireEvent.changeText(getByTestId("password-input"), "Secret1!");
    fireEvent.changeText(getByTestId("confirm-password-input"), "Secret1@");
    fireEvent.press(getByTestId("validate-button"));

    expect(onGoToResults).toHaveBeenCalledTimes(1);
    const report = onGoToResults.mock.calls[0][0];
    expect(report.passStatus.passed).toBe(false);
    expect(report.passStatus.hardFailures).toContain("confirmMatches");
  });
});

