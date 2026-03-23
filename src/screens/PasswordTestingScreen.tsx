import React, { useMemo, useReducer } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import type {
  PasswordAnalysisConfig,
  PasswordAnalysisReport,
} from "../domain/password/models";
import { analyzePassword } from "../domain/password/PasswordValidator";
import { PasswordInput } from "../components/PasswordInput";
import { analysisReducer, initialAnalysisState } from "../state/analysis/analysisReducer";

export type PasswordTestingScreenProps = {
  config: PasswordAnalysisConfig;
  onGoToResults: (report: PasswordAnalysisReport) => void;
  onGoToSettings: () => void;
  onGoToWelcome: () => void;
};

export function PasswordTestingScreen({
  config,
  onGoToResults,
  onGoToSettings,
  onGoToWelcome,
}: PasswordTestingScreenProps) {
  const [state, dispatch] = useReducer(analysisReducer, initialAnalysisState);

  const showConfirm = useMemo(() => {
    return config.enabledRuleIds.includes("confirmMatches") && config.policy.requireConfirmMatch;
  }, [config.enabledRuleIds, config.policy.requireConfirmMatch]);

  const validateNow = () => {
    dispatch({ type: "validateStart" });
    const input = {
      password: state.password,
      confirmPassword: showConfirm ? state.confirmPassword : undefined,
    };

    const outcome = analyzePassword(input, config);
    if (outcome.state === "error") {
      dispatch({ type: "validateError", message: outcome.message });
      return;
    }

    dispatch({ type: "validateSuccess", report: outcome });
    onGoToResults(outcome);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Password Testing</Text>
      <Text style={styles.hint}>
        Enter a password and see rule-by-rule validation, a strength score, and deterministic suggestions.
      </Text>

      <PasswordInput
        password={state.password}
        confirmPassword={state.confirmPassword}
        showConfirm={showConfirm}
        onChangePassword={(next) => dispatch({ type: "inputChanged", password: next, confirmPassword: state.confirmPassword })}
        onChangeConfirmPassword={(next) => dispatch({ type: "inputChanged", password: state.password, confirmPassword: next })}
      />

      <View style={{ height: 14 }} />

      {state.status === "validating" ? (
        <Text style={styles.status}>Analyzing…</Text>
      ) : state.status === "error" ? (
        <Text style={[styles.status, styles.error]} testID="analysis-error">
          {state.message}
        </Text>
      ) : null}

      <View style={{ height: 14 }} />

      <View style={{ width: "100%", paddingHorizontal: 16 }}>
        <Button
          testID="validate-button"
          title={state.status === "validating" ? "Validating..." : "Validate / Analyze"}
          onPress={validateNow}
          disabled={state.status === "validating"}
        />
      </View>

      <View style={{ height: 12 }} />

      <View style={styles.actionsRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button title="Settings" onPress={onGoToSettings} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Button title="Back" onPress={onGoToWelcome} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 24, paddingBottom: 40, flexGrow: 1 },
  header: { paddingHorizontal: 16, fontSize: 20, fontWeight: "800", color: "#111" },
  hint: { paddingHorizontal: 16, marginTop: 8, color: "#444", lineHeight: 18 },
  status: { paddingHorizontal: 16, color: "#444", marginTop: 12 },
  error: { color: "#d32f2f", fontWeight: "700" },
  actionsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 12 },
});

