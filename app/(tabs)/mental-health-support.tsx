import { FontAwesome } from "@expo/vector-icons";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
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
  labelFr: string;
  number: string;
  note: string;
  noteFr: string;
};

const HELP_LINES: HelpLine[] = [
  {
    label: "988 Suicide & Crisis Lifeline",
    labelFr: "Ligne 988 crise et prevention",
    number: "988",
    note: "24/7 free confidential support (US/Canada routing varies).",
    noteFr: "Soutien gratuit et confidentiel 24/7.",
  },
  {
    label: "Emergency Services",
    labelFr: "Services d'urgence",
    number: "911",
    note: "Call immediately for life-threatening emergencies.",
    noteFr: "Appelez immediatement en cas d'urgence vitale.",
  },
  {
    label: "DFF Support Line",
    labelFr: "Ligne de soutien DFF",
    number: "+1-555-100-2020",
    note: "Foundation support line (replace with official number).",
    noteFr: "Ligne de soutien de la fondation (a remplacer).",
  },
];

export default function MentalHealthSupportTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const t = {
    title: isFrench ? "Soutien en sante mentale" : "Mental Health Support",
    sub: isFrench ? "Vous n'etes pas seul. Nous sommes la pour vous aider." : "You are not alone. Reach out and we will support you.",
    requestForm: isFrench ? "Formulaire de demande" : "Request Form",
    note: isFrench ? "Les demandes sont examinees par un admin DFF." : "Submitted requests are reviewed by a DFF admin.",
    fullName: isFrench ? "NOM COMPLET" : "FULL NAME",
    phone: isFrench ? "TELEPHONE" : "PHONE",
    helpPrompt: isFrench ? "COMMENT POUVONS-NOUS AIDER?" : "HOW CAN WE HELP?",
    submit: isFrench ? "Soumettre la demande" : "Submit Request",
    lines: isFrench ? "Lignes d'aide" : "Help Lines",
    namePlaceholder: isFrench ? "Votre nom complet" : "Your full name",
    phonePlaceholder: isFrench ? "Votre numero de telephone" : "Your phone number",
    detailsPlaceholder: isFrench ? "Expliquez le soutien dont vous avez besoin" : "Share what support you need",
    call: isFrench ? "Appeler" : "Call",
  };
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: isDark ? "#ffffff" : "#16131f" }]}>{t.title}</Text>
        <Text style={[styles.sub, { color: isDark ? "#cfc9db" : "#5f566d" }]}>{t.sub}</Text>

        <View style={[styles.formCard, { backgroundColor: isDark ? "#171321" : "#ffffff", borderColor: isDark ? "#2a2338" : "#ece5f7" }]}>
          <Text style={[styles.cardTitle, { color: isDark ? "#ffffff" : "#1a1723" }]}>{t.requestForm}</Text>
          <Text style={[styles.cardNote, { color: isDark ? "#bdb6cc" : "#766f87" }]}>{t.note}</Text>

          <Text style={[styles.label, { color: isDark ? "#dfd8ee" : "#8c859c" }]}>{t.fullName}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? "#241d31" : "#f2edf9", color: isDark ? "#ffffff" : "#2e2a39" }]}
            placeholder={t.namePlaceholder}
            placeholderTextColor={isDark ? "#b1a9c2" : "#958ca8"}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={[styles.label, { color: isDark ? "#dfd8ee" : "#8c859c" }]}>{t.phone}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? "#241d31" : "#f2edf9", color: isDark ? "#ffffff" : "#2e2a39" }]}
            placeholder={t.phonePlaceholder}
            placeholderTextColor={isDark ? "#b1a9c2" : "#958ca8"}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={[styles.label, { color: isDark ? "#dfd8ee" : "#8c859c" }]}>{t.helpPrompt}</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: isDark ? "#241d31" : "#f2edf9", color: isDark ? "#ffffff" : "#2e2a39" },
            ]}
            placeholder={t.detailsPlaceholder}
            placeholderTextColor={isDark ? "#b1a9c2" : "#958ca8"}
            value={requestDetails}
            onChangeText={setRequestDetails}
            multiline
            textAlignVertical="top"
          />

          <Pressable style={styles.submitButton} onPress={handleRequestSubmit}>
            <Text style={styles.submitText}>{t.submit}</Text>
          </Pressable>
        </View>

        <View style={[styles.linesCard, { backgroundColor: isDark ? "#171321" : "#ffffff", borderColor: isDark ? "#2a2338" : "#ece5f7" }]}>
          <Text style={[styles.cardTitle, { color: isDark ? "#ffffff" : "#1a1723" }]}>{t.lines}</Text>
          {HELP_LINES.map((line) => (
            <View key={line.label} style={[styles.lineItem, { borderColor: isDark ? "#2f2740" : "#f0eaf8", backgroundColor: isDark ? "#211a2e" : "#fff" }]}>
              <View style={styles.lineTextWrap}>
                <Text style={[styles.lineLabel, { color: isDark ? "#ffffff" : "#1f1b2b" }]}>{isFrench ? line.labelFr : line.label}</Text>
                <Text style={[styles.lineNumber, { color: isDark ? "#ffffff" : "#171321" }]}>{line.number}</Text>
                <Text style={[styles.lineNote, { color: isDark ? "#c5bdd6" : "#726b82" }]}>{isFrench ? line.noteFr : line.note}</Text>
              </View>
              <Pressable style={styles.callButton} onPress={() => handleCall(line.number)}>
                <FontAwesome name="phone" size={14} color="#fff" />
                <Text style={styles.callText}>{t.call}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  title: { fontSize: 34, fontWeight: "800" },
  sub: { marginTop: 8, fontSize: 16, lineHeight: 23 },

  formCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  linesCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 20, fontWeight: "800" },
  cardNote: { marginTop: 6, fontSize: 13 },

  label: { marginTop: 12, fontSize: 12, fontWeight: "700" },
  input: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
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
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  lineTextWrap: { flex: 1 },
  lineLabel: { fontSize: 14, fontWeight: "700" },
  lineNumber: { marginTop: 4, fontSize: 18, fontWeight: "800" },
  lineNote: { marginTop: 4, fontSize: 12, lineHeight: 18 },

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
