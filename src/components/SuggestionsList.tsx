import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SuggestionItem } from "../domain/password/models";

export type SuggestionsListProps = {
  suggestions: SuggestionItem[];
};

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container} testID="suggestions-list">
      <Text style={styles.title}>Suggestions</Text>
      {suggestions.map((s) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.prefix}>{s.severity === "info" ? "INFO" : "FIX"}</Text>
          <Text style={styles.text}>{s.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10 },
  row: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  prefix: { fontSize: 12, fontWeight: "700", color: "#333" },
  text: { fontSize: 13, color: "#444", marginTop: 6 },
});

