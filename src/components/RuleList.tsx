import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { RuleResult } from "../domain/password/models";

export type RuleListProps = {
  results: RuleResult[];
};

export function RuleList({ results }: RuleListProps) {
  return (
    <View style={styles.container} testID="rule-list">
      {results.map((r) => (
        <View
          key={r.ruleId}
          style={[
            styles.ruleRow,
            { borderColor: r.passed ? "#c8e6c9" : "#ffcdd2" },
          ]}
          testID={`rule-${r.ruleId}`}
        >
          <Text style={[styles.ruleId, { color: r.passed ? "#2e7d32" : "#d32f2f" }]}>
            {r.ruleId}
          </Text>
          <Text style={styles.passFail}>{r.passed ? "PASS" : "FAIL"}</Text>
          {r.evidence.length > 0 ? (
            <Text style={styles.evidence}>{r.evidence.join(" · ")}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 16, marginTop: 12 },
  ruleRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  ruleId: { fontSize: 14, fontWeight: "700" },
  passFail: { fontSize: 12, marginTop: 2, color: "#333" },
  evidence: { fontSize: 12, marginTop: 8, color: "#444" },
});

