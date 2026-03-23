import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native";

export type WelcomeScreenProps = {
  onGoToTest: () => void;
  onGoToSettings: () => void;
};

export function WelcomeScreen({ onGoToTest, onGoToSettings }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password Validator Lab</Text>
      <Text style={styles.subtitle}>
        Test deterministic validation, scoring, and explainable results.
      </Text>
      <View style={{ height: 16 }} />
      <Button title="Start Password Testing" onPress={onGoToTest} />
      <View style={{ height: 12 }} />
      <Button title="Rules / Settings" onPress={onGoToSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center" },
  subtitle: { color: "#444", textAlign: "center" },
});

