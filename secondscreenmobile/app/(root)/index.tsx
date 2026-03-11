import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

export default function JoinSessionScreen() {
  const [sessionCode, setSessionCode] = useState("");

  const handleJoin = () => {
    router.push(`./${sessionCode}`);
    console.log("Joining session:", sessionCode);
  };

  return (
    <LinearGradient
      colors={["#020617", "#020617", "#020617"]}
      style={styles.container}>
      <KeyboardAvoidingView
        style={styles.center}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Connect to Desktop</Text>

          <Text style={styles.subtitle}>
            Enter the session code from your desktop to view the shared screen.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Session Code</Text>

            <TextInput
              placeholder="Enter code"
              placeholderTextColor="#94a3b8"
              value={sessionCode}
              onChangeText={setSessionCode}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
            <Text style={styles.joinText}>Join Session</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: 24,
    fontSize: 14,
  },

  inputContainer: {
    marginBottom: 20,
  },

  label: {
    color: "#cbd5f5",
    marginBottom: 6,
    fontSize: 13,
  },

  input: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 8,
    color: "white",
    borderWidth: 1,
    borderColor: "#475569",
    fontSize: 16,
  },

  joinButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  joinText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
