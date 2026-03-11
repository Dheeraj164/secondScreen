import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { z } from "zod";
import { supabase } from "@/utils/supabase";

const emailRegex = /^[^\s@]+@[^\s@]+\.(com|edu)$/;

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .regex(emailRegex, "Email must contain @ and end with .com or .edu"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
});

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [seePassword, setSeePassword] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });

      return;
    }

    setErrors({});
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert(error.name, error.message);
  };

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b", "#0f172a"]}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>Login to your account</Text>
          <Text style={styles.subtitle}>
            Enter your email below to login to your account
          </Text>

          {/* EMAIL */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>

            <TextInput
              placeholder="m@example.com"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />

            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* PASSWORD */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="********"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                secureTextEntry={!seePassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />

              <Pressable
                onPress={() => setSeePassword(!seePassword)}
                style={styles.seePassword}>
                <Feather
                  name={seePassword ? "eye" : "eye-off"}
                  size={20}
                  color="#cbd5f5"
                />
              </Pressable>
            </View>

            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {/* GOOGLE BUTTON */}
          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleText}>Login with Google</Text>
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
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "white",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 20,
  },

  inputContainer: {
    marginBottom: 16,
  },

  label: {
    color: "#cbd5f5",
    marginBottom: 6,
    fontSize: 13,
  },

  passwordWrapper: {
    position: "relative",
  },

  input: {
    backgroundColor: "#334155",
    padding: 12,
    paddingRight: 40,
    borderRadius: 8,
    color: "white",
    borderWidth: 1,
    borderColor: "#475569",
  },

  seePassword: {
    position: "absolute",
    right: 10,
    top: 12,
  },

  errorText: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 4,
  },

  loginButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },

  loginText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  googleButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#475569",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  googleText: {
    color: "#e2e8f0",
    fontWeight: "500",
  },
});
