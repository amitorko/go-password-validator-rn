import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type WarnListProps = {
  warnings: string[];
};

export function WarnList({ warnings }: WarnListProps) {
  if (warnings.length === 0) return null;

  return (
    <View style={styles.container} testID="warning-list">
      <Text style={styles.title}>Warnings</Text>
      {warnings.map((w, idx) => (
        <Text key={`${idx}-${w}`} style={styles.item}>
          - {w}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 14 },
  title: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 8 },
  item: { fontSize: 13, color: "#444", marginBottom: 4 },
});

