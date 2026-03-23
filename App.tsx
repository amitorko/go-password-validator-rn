import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import type { PasswordAnalysisConfig, PasswordAnalysisReport } from "./src/domain/password/models";
import { createDefaultPasswordAnalysisConfig } from "./src/domain/password/defaultConfig";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { PasswordTestingScreen } from "./src/screens/PasswordTestingScreen";
import { ResultsScreen } from "./src/screens/ResultsScreen";
import { RulesSettingsScreen } from "./src/screens/RulesSettingsScreen";

export default function App() {
  type AppScreen = "welcome" | "testing" | "results" | "settings";
  const defaultConfig = useMemo(() => createDefaultPasswordAnalysisConfig(), []);
  const [config, setConfig] = useState<PasswordAnalysisConfig>(defaultConfig);
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [report, setReport] = useState<PasswordAnalysisReport | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <StatusBar style="auto" />
        {screen === "welcome" ? (
          <WelcomeScreen
            onGoToTest={() => setScreen("testing")}
            onGoToSettings={() => setScreen("settings")}
          />
        ) : null}

        {screen === "testing" ? (
          <PasswordTestingScreen
            config={config}
            onGoToResults={(r) => {
              setReport(r);
              setScreen("results");
            }}
            onGoToSettings={() => setScreen("settings")}
            onGoToWelcome={() => setScreen("welcome")}
          />
        ) : null}

        {screen === "results" && report ? (
          <ResultsScreen
            report={report}
            onBackToTesting={() => setScreen("testing")}
            onGoToSettings={() => setScreen("settings")}
            onGoToWelcome={() => setScreen("welcome")}
          />
        ) : null}

        {screen === "settings" ? (
          <RulesSettingsScreen
            config={config}
            onApply={(next) => {
              setConfig(next);
              setScreen("testing");
            }}
            onBackToTesting={() => setScreen("testing")}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
});
