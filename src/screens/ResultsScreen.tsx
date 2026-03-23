import React from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PasswordAnalysisReport } from "../domain/password/models";
import { StrengthBadge } from "../components/StrengthBadge";
import { RuleList } from "../components/RuleList";
import { WarnList } from "../components/WarnList";
import { SuggestionsList } from "../components/SuggestionsList";

export type ResultsScreenProps = {
  report: PasswordAnalysisReport;
  onBackToTesting: () => void;
  onGoToSettings: () => void;
  onGoToWelcome: () => void;
};

export function ResultsScreen({
  report,
  onBackToTesting,
  onGoToSettings,
  onGoToWelcome,
}: ResultsScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Results</Text>

      <StrengthBadge score={report.strength.score} category={report.strength.category} />

      <View style={styles.passBox} testID="pass-status">
        <Text style={[styles.passText, { color: report.passStatus.passed ? "#2e7d32" : "#d32f2f" }]}>
          {report.passStatus.passed ? "PASS" : "FAIL"}
        </Text>
        <Text style={styles.passReason}>{report.passStatus.reason}</Text>
      </View>

      <RuleList results={report.results} />
      <WarnList warnings={report.warnings} />
      <SuggestionsList suggestions={report.suggestions} />

      <View style={styles.actionsRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button title="Edit" onPress={onBackToTesting} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Button title="Settings" onPress={onGoToSettings} />
        </View>
      </View>

      <View style={{ height: 12 }} />
      <Button title="Back to Welcome" onPress={onGoToWelcome} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 24, paddingBottom: 40, flexGrow: 1 },
  header: { paddingHorizontal: 16, fontSize: 20, fontWeight: "800", color: "#111" },
  passBox: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  passText: { fontSize: 18, fontWeight: "800" },
  passReason: { color: "#444", marginTop: 6, lineHeight: 18 },
  actionsRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 16 },
});

