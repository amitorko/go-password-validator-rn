import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PasswordTestingScreen } from "../../screens/PasswordTestingScreen";
import { createDefaultPasswordAnalysisConfig } from "../../domain/password/defaultConfig";
import type { PasswordAnalysisConfig } from "../../domain/password/models";

function makeConfig(overrides: Partial<PasswordAnalysisConfig>): PasswordAnalysisConfig {
  const base = createDefaultPasswordAnalysisConfig();
  return { ...base, ...overrides };
}

describe("PasswordTestingScreen", () => {
  test("typing password and pressing Validate invokes onGoToResults with a report", () => {
    const config = makeConfig({
      enabledRuleIds: [
        "minLength",
        "maxLength",
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
        hardFailRuleIds: ["maxLength"],
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

    fireEvent.changeText(getByTestId("password-input"), "Abcdefgh!1Strong");
    fireEvent.press(getByTestId("validate-button"));

    expect(onGoToResults).toHaveBeenCalledTimes(1);
    const report = onGoToResults.mock.calls[0][0];
    expect(report.state).toBe("success");
    expect(report.passStatus).toBeDefined();
  });

  test("successful analysis path: strong password yields success report state", () => {
    const config = makeConfig({});
    const onGoToResults = jest.fn();

    const { getByTestId } = render(
      <PasswordTestingScreen
        config={config}
        onGoToResults={onGoToResults}
        onGoToSettings={() => {}}
        onGoToWelcome={() => {}}
      />,
    );

    fireEvent.changeText(getByTestId("password-input"), "Abcdefgh!1Unique");
    fireEvent.press(getByTestId("validate-button"));

    expect(onGoToResults).toHaveBeenCalled();
    const report = onGoToResults.mock.calls[0][0];
    expect(report.state).toBe("success");
    expect(report.strength.category).toBeDefined();
  });

  test("invalid config shows error state (analyzePassword returns error first)", () => {
    const badConfig = {
      ...createDefaultPasswordAnalysisConfig(),
      enabledRuleIds: [] as unknown as PasswordAnalysisConfig["enabledRuleIds"],
    };
    const onGoToResults = jest.fn();

    const { getByTestId } = render(
      <PasswordTestingScreen
        config={badConfig}
        onGoToResults={onGoToResults}
        onGoToSettings={() => {}}
        onGoToWelcome={() => {}}
      />,
    );

    fireEvent.changeText(getByTestId("password-input"), "x");
    fireEvent.press(getByTestId("validate-button"));

    expect(onGoToResults).not.toHaveBeenCalled();
    expect(getByTestId("analysis-error").props.children).toBeTruthy();
  });

  test("confirmMatches mismatch: hard-fail when confirm rule enabled and required", () => {
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

  test("confirmMatches match: passes confirm rule", () => {
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
    fireEvent.changeText(getByTestId("confirm-password-input"), "Secret1!");
    fireEvent.press(getByTestId("validate-button"));

    const report = onGoToResults.mock.calls[0][0];
    const confirm = report.results.find((r) => r.ruleId === "confirmMatches");
    expect(confirm?.passed).toBe(true);
  });

  test("mutation-resistant: confirm equality — mismatch must fail confirm rule", () => {
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

    fireEvent.changeText(getByTestId("password-input"), "Aa1!aaaaaa");
    fireEvent.changeText(getByTestId("confirm-password-input"), "Aa1!aaaaaaX");
    fireEvent.press(getByTestId("validate-button"));

    const report = onGoToResults.mock.calls[0][0];
    expect(report.results.find((r) => r.ruleId === "confirmMatches")?.passed).toBe(false);
  });
});
