import { FontAwesome } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HelpLine = {
  label: string;
  number: string;
  note: string;
};

const HELP_LINES: HelpLine[] = [
  {
    label: "988 Suicide & Crisis Lifeline",
    number: "988",
    note: "24/7 free confidential support (US/Canada routing varies).",
  },
  {
    label: "Emergency Services",
    number: "911",
    note: "Call immediately for life-threatening emergencies.",
  },
  {
    label: "DFF Support Line",
    number: "+1-555-100-2020",
    note: "Foundation support line (replace with official number).",
  },
];

export default function MentalHealthSupportTab() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestDetails, setRequestDetails] = useState("");

  const handleCall = async (number: string) => {
    const telUrl = `tel:${number.replace(/[^\d+]/g, "")}`;
    const canOpen = await Linking.canOpenURL(telUrl);
    if (!canOpen) {
      Alert.alert("Call unavailable", "This device cannot place phone calls.");
      return;
    }
    await Linking.openURL(telUrl);
  };

  const handleRequestSubmit = () => {
    if (!fullName.trim() || !phone.trim() || !requestDetails.trim()) {
      Alert.alert("Missing fields", "Please complete name, phone, and request details.");
      return;
    }

    Alert.alert(
      "Request submitted",
      "Your request has been received and will be reviewed by an admin."
    );

    setFullName("");
    setPhone("");
    setRequestDetails("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mental Health Support</Text>
        <Text style={styles.sub}>You are not alone. Reach out and we will support you.</Text>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Request Form</Text>
          <Text style={styles.cardNote}>Submitted requests are reviewed by a DFF admin.</Text>

          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>PHONE</Text>
          <TextInput
            style={styles.input}
            placeholder="Your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>HOW CAN WE HELP?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share what support you need"
            value={requestDetails}
            onChangeText={setRequestDetails}
            multiline
            textAlignVertical="top"
          />

          <Pressable style={styles.submitButton} onPress={handleRequestSubmit}>
            <Text style={styles.submitText}>Submit Request</Text>
          </Pressable>
        </View>

        <View style={styles.linesCard}>
          <Text style={styles.cardTitle}>Help Lines</Text>
          {HELP_LINES.map((line) => (
            <View key={line.label} style={styles.lineItem}>
              <View style={styles.lineTextWrap}>
                <Text style={styles.lineLabel}>{line.label}</Text>
                <Text style={styles.lineNumber}>{line.number}</Text>
                <Text style={styles.lineNote}>{line.note}</Text>
              </View>
              <Pressable style={styles.callButton} onPress={() => handleCall(line.number)}>
                <FontAwesome name="phone" size={14} color="#fff" />
                <Text style={styles.callText}>Call</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f2f8" },
  content: { padding: 20, paddingBottom: 30 },
  title: { fontSize: 34, fontWeight: "800", color: "#16131f" },
  sub: { marginTop: 8, fontSize: 16, color: "#5f566d", lineHeight: 23 },

  formCard: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ece5f7",
  },
  linesCard: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ece5f7",
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#1a1723" },
  cardNote: { marginTop: 6, fontSize: 13, color: "#766f87" },

  label: { marginTop: 12, fontSize: 12, color: "#8c859c", fontWeight: "700" },
  input: {
    marginTop: 6,
    backgroundColor: "#f2edf9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2e2a39",
  },
  textArea: { minHeight: 110 },

  submitButton: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  lineItem: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#f0eaf8",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  lineTextWrap: { flex: 1 },
  lineLabel: { fontSize: 14, fontWeight: "700", color: "#1f1b2b" },
  lineNumber: { marginTop: 4, fontSize: 18, fontWeight: "800", color: "#171321" },
  lineNote: { marginTop: 4, fontSize: 12, color: "#726b82", lineHeight: 18 },

  callButton: {
    height: 38,
    minWidth: 78,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#d40000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  callText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
