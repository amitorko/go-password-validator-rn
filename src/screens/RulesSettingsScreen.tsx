import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { PasswordAnalysisConfig, RuleId } from "../domain/password/models";
import { RuleIds } from "../domain/password/models";
import { validatePasswordAnalysisConfig } from "../domain/password/services/configValidation";
import { Button } from "react-native";

export type RulesSettingsScreenProps = {
  config: PasswordAnalysisConfig;
  onApply: (nextConfig: PasswordAnalysisConfig) => void;
  onBackToTesting: () => void;
};

const LABELS: Record<RuleId, string> = {
  minLength: "Minimum Length",
  maxLength: "Maximum Length",
  hasUppercase: "Has Uppercase",
  hasLowercase: "Has Lowercase",
  hasNumber: "Has Number",
  hasSpecial: "Has Special Character",
  noSpaces: "No Whitespace",
  noRepeatedSequences: "No Repeated Sequences",
  noCommonPassword: "No Common Password",
  entropyAtLeast: "Entropy Threshold",
  confirmMatches: "Confirm Password Matches",
};

function parseIntOrUndefined(v: string): number | undefined {
  const trimmed = v.trim();
  if (trimmed.length === 0) return undefined;
  const n = Number.parseInt(trimmed, 10);
  if (Number.isNaN(n)) return undefined;
  return n;
}

export function RulesSettingsScreen({
  config,
  onApply,
  onBackToTesting,
}: RulesSettingsScreenProps) {
  const [draft, setDraft] = useState<PasswordAnalysisConfig>(config);

  const disabled = useMemo(() => {
    const err = validatePasswordAnalysisConfig(draft);
    return err ? true : false;
  }, [draft]);

  const configError = useMemo(() => validatePasswordAnalysisConfig(draft), [draft]);

  const setEnabled = (ruleId: RuleId, enabled: boolean) => {
    setDraft((prev) => {
      const set = new Set(prev.enabledRuleIds);
      if (enabled) set.add(ruleId);
      else set.delete(ruleId);

      const nextEnabledRuleIds = Array.from(set);

      // Keep confirm-related policy in sync with confirmMatches rule enable toggle.
      let nextPolicy = prev.policy;
      if (ruleId === "confirmMatches") {
        nextPolicy = {
          ...prev.policy,
          requireConfirmMatch: enabled,
        };
      }

      if (ruleId === "entropyAtLeast") {
        nextPolicy = {
          ...prev.policy,
          entropyAtLeast: enabled
            ? prev.policy.entropyAtLeast ?? { entropyMinBits: 35 }
            : undefined,
        };
      }

      return { ...prev, enabledRuleIds: nextEnabledRuleIds, policy: nextPolicy };
    });
  };

  const updateNumberField = (path: "minLength" | "maxLength", value: string) => {
    const n = parseIntOrUndefined(value);
    if (n === undefined) return;
    setDraft((prev) => ({ ...prev, policy: { ...prev.policy, [path]: n } }));
  };

  const updateRepeated = (path: "minSeqLen" | "maxSeqCount", value: string) => {
    const n = parseIntOrUndefined(value);
    if (n === undefined) return;
    setDraft((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        noRepeatedSequences: { ...prev.policy.noRepeatedSequences, [path]: n },
      },
    }));
  };

  const updateEntropyMinBits = (value: string) => {
    const n = parseIntOrUndefined(value);
    if (n === undefined) return;
    setDraft((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        entropyAtLeast: prev.policy.entropyAtLeast
          ? { ...prev.policy.entropyAtLeast, entropyMinBits: n }
          : { entropyMinBits: n },
      },
    }));
  };

  const hasRule = (ruleId: RuleId) => draft.enabledRuleIds.includes(ruleId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Rules / Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Length</Text>
        <TextInput
          testID="min-length-input"
          style={styles.smallInput}
          keyboardType="numeric"
          value={String(draft.policy.minLength)}
          onChangeText={(t) => updateNumberField("minLength", t)}
        />
        <TextInput
          testID="max-length-input"
          style={styles.smallInput}
          keyboardType="numeric"
          value={String(draft.policy.maxLength)}
          onChangeText={(t) => updateNumberField("maxLength", t)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>No Whitespace</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Disallow whitespace</Text>
          <Switch
            testID="no-spaces-switch"
            value={draft.policy.disallowWhitespace}
            onValueChange={(v) => setDraft((prev) => ({ ...prev, policy: { ...prev.policy, disallowWhitespace: v } }))}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repeated Sequences</Text>
        <View style={styles.row}>
          <Text style={styles.label}>minSeqLen</Text>
          <TextInput
            testID="min-seq-len-input"
            style={styles.smallInput}
            keyboardType="numeric"
            value={String(draft.policy.noRepeatedSequences.minSeqLen)}
            onChangeText={(t) => updateRepeated("minSeqLen", t)}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>maxSeqCount</Text>
          <TextInput
            testID="max-seq-count-input"
            style={styles.smallInput}
            keyboardType="numeric"
            value={String(draft.policy.noRepeatedSequences.maxSeqCount)}
            onChangeText={(t) => updateRepeated("maxSeqCount", t)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optional Rules</Text>
        {RuleIds.map((ruleId) => (
          <View key={ruleId} style={styles.rowBetween}>
            <Text style={styles.ruleLabel}>{LABELS[ruleId]}</Text>
            <Switch testID={`toggle-${ruleId}`} value={hasRule(ruleId)} onValueChange={(v) => setEnabled(ruleId, v)} />
          </View>
        ))}
      </View>

      {hasRule("entropyAtLeast") ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entropy Threshold</Text>
          <View style={styles.row}>
            <Text style={styles.label}>min bits</Text>
            <TextInput
              testID="entropy-minbits-input"
              style={styles.smallInput}
              keyboardType="numeric"
              value={String(draft.policy.entropyAtLeast?.entropyMinBits ?? 35)}
              onChangeText={updateEntropyMinBits}
            />
          </View>
        </View>
      ) : null}

      {configError ? (
        <Text style={styles.error} testID="config-error">
          {configError.message}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button title="Apply" disabled={disabled} onPress={() => onApply(draft)} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Button title="Back" onPress={onBackToTesting} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 24, paddingBottom: 40 },
  header: { paddingHorizontal: 16, fontSize: 20, fontWeight: "900", color: "#111", marginBottom: 10 },
  section: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#333", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 13, color: "#333", fontWeight: "600" },
  ruleLabel: { fontSize: 13, color: "#333", fontWeight: "600", flex: 1, marginRight: 10 },
  smallInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    minWidth: 92,
    backgroundColor: "#fff",
  },
  error: { paddingHorizontal: 16, marginTop: 10, color: "#d32f2f", fontWeight: "700" },
  actionsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 10 },
});

