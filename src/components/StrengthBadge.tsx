import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StrengthCategory } from "../domain/password/models";

export type StrengthBadgeProps = {
  score: number;
  category: StrengthCategory;
};

function categoryColor(category: StrengthCategory): string {
  switch (category) {
    case "Very Weak":
      return "#d32f2f";
    case "Weak":
      return "#f57c00";
    case "Medium":
      return "#1976d2";
    case "Strong":
      return "#2e7d32";
    default:
      return "#555";
  }
}

export function StrengthBadge({ score, category }: StrengthBadgeProps) {
  const color = categoryColor(category);
  return (
    <View style={styles.container}>
      <Text style={[styles.category, { color }]}>{category}</Text>
      <Text style={styles.score}>Score: {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  category: { fontSize: 18, fontWeight: "700" },
  score: { marginTop: 4, color: "#333" },
});

