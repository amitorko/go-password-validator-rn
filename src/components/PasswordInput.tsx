import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export type PasswordInputProps = {
  password: string;
  confirmPassword?: string;
  showConfirm: boolean;
  onChangePassword: (next: string) => void;
  onChangeConfirmPassword: (next: string) => void;
};

export function PasswordInput({
  password,
  confirmPassword,
  showConfirm,
  onChangePassword,
  onChangeConfirmPassword,
}: PasswordInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Password</Text>
      <TextInput
        testID="password-input"
        style={styles.input}
        value={password}
        onChangeText={onChangePassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      {showConfirm ? (
        <>
          <Text style={[styles.label, { marginTop: 12 }]}>Confirm Password</Text>
          <TextInput
            testID="confirm-password-input"
            style={styles.input}
            value={confirmPassword ?? ""}
            onChangeText={onChangeConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 16 },
  label: { fontSize: 14, color: "#333", marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
});

