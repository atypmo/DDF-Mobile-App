import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

export default function MfaSetupScreen() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    if (!phone.trim()) {
      Alert.alert("Phone required", "Enter a phone number in international format, like +14165551234.");
      return;
    }

    try {
      setLoading(true);
      const enroll = await supabase.auth.mfa.enroll({
        factorType: "phone",
        phone: phone.trim(),
        friendlyName: "SMS",
      });

      if (enroll.error || !enroll.data?.id) {
        Alert.alert("SMS setup failed", enroll.error?.message ?? "Could not enroll phone factor.");
        return;
      }

      const challenge = await supabase.auth.mfa.challenge({ factorId: enroll.data.id });
      if (challenge.error || !challenge.data?.id) {
        Alert.alert("SMS setup failed", challenge.error?.message ?? "Could not send SMS code.");
        return;
      }

      setFactorId(enroll.data.id);
      setChallengeId(challenge.data.id);
      Alert.alert("Code sent", "Enter the SMS code to finish setup.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!factorId || !challengeId || !code.trim()) {
      Alert.alert("Missing info", "Start setup first, then enter the SMS code.");
      return;
    }

    try {
      setLoading(true);
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.trim(),
      });
      if (verify.error) {
        Alert.alert("Verification failed", verify.error.message);
        return;
      }

      Alert.alert("SMS enabled", "Your account now has SMS 2-step verification enabled.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>SMS Security Setup</Text>
        <Text style={styles.sub}>Set up phone verification for secure sign-in.</Text>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+14165551234"
          autoCapitalize="none"
          keyboardType="phone-pad"
        />

        <Pressable style={styles.primaryBtn} onPress={startSetup} disabled={loading}>
          <Text style={styles.primaryText}>{loading ? "Sending..." : "Send SMS Code"}</Text>
        </Pressable>

        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
        />

        <Pressable style={styles.secondaryBtn} onPress={verifyCode} disabled={loading}>
          <Text style={styles.secondaryText}>{loading ? "Verifying..." : "Verify and Enable SMS"}</Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0c15", justifyContent: "center", padding: 18 },
  card: { backgroundColor: "#171321", borderRadius: 16, borderWidth: 1, borderColor: "#2a2338", padding: 16 },
  title: { color: "#fff", fontSize: 25, fontWeight: "800" },
  sub: { color: "#c9c1d8", marginTop: 6, marginBottom: 14 },
  label: { color: "#d7cfe8", fontSize: 12, fontWeight: "700", marginTop: 10 },
  input: { marginTop: 6, backgroundColor: "#241d31", borderRadius: 10, padding: 12, color: "#fff" },
  primaryBtn: { marginTop: 14, backgroundColor: "#d40000", borderRadius: 10, height: 44, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondaryBtn: { marginTop: 14, backgroundColor: "#2e263d", borderRadius: 10, height: 44, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#fff", fontWeight: "700" },
  cancel: { marginTop: 14, color: "#a79dbb", textAlign: "center", fontWeight: "700" },
});
