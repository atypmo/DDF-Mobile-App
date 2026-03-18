import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SettingsTab() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Logout failed", error.message);
        return;
      }
      router.replace("/login");
    } catch {
      Alert.alert("Logout failed", "Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.sub}>Manage account, notifications, and preferences.</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
        <Text style={styles.logoutText}>{isLoggingOut ? "Logging out..." : "Log Out"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "800", color: "#16131f" },
  sub: { marginTop: 10, fontSize: 17, color: "#5f566d", lineHeight: 24 },
  logoutButton: {
    marginTop: 26,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
