import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

const CONTACT_EMAIL = "admin@dforbesfoundation.com";
const CONTACT_PHONE = "416-672-0614";
const CONTACT_ADDRESS = "889 Pantera Drive, Mississauga ON L6Y 6H8 Unit 3";

export default function ContactTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = {
    title: isFrench ? "Contactez-nous" : "Get in touch",
    messageTitle: isFrench ? "Envoyez-nous un message" : "Message us",
    messageHelp: isFrench
      ? "Nous serions ravis de vous lire. Remplissez le formulaire ci-dessous et notre equipe admin vous repondra rapidement."
      : "We'd love to hear from you. Fill out the form below and our admin team will review and respond as soon as possible.",
    required: isFrench ? "Les champs marques d'un * sont requis" : "Fields marked with a * are required",
    name: isFrench ? "Nom *" : "Name *",
    email: isFrench ? "Courriel *" : "Email *",
    msg: isFrench ? "Message *" : "Message *",
    submit: isFrench ? "SUBMIT" : "SUBMIT",
    openEmail: isFrench ? "Ouvrir l'email" : "Open Email App",
  };

  const openEmailApp = async (subject: string, body: string) => {
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (!canOpen) {
      Alert.alert("Email unavailable", "No mail app found on this device.");
      return;
    }
    await Linking.openURL(mailto);
  };

  const onSubmitForm = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert("Missing fields", "Please complete Name, Email, and Message.");
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        user_id: user?.id ?? null,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      };

      const insertResult = await supabase.from("contact_messages").insert(payload);
      if (insertResult.error) {
        throw new Error(insertResult.error.message);
      }
      Alert.alert("Submitted", "Your message has been sent to the DFF admin inbox.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not submit message.";
      Alert.alert("Submit failed", text);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f4f4f6" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={isDark ? ["#171321", "#220b12"] : ["#ffffff", "#f7f2f3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: isDark ? "#2a2338" : "#ece5e7" }]}
        >
          <Text style={[styles.heroTitle, { color: isDark ? "#fff" : "#0f0f16" }]}>{t.title}</Text>

          <View style={styles.contactRow}>
            <FontAwesome name="map-marker" size={20} color="#d40000" />
            <Text style={styles.contactValue}>{CONTACT_ADDRESS}</Text>
          </View>

          <Pressable style={styles.contactRow} onPress={() => void openEmailApp("DFF Inquiry", "")}>
            <FontAwesome name="envelope" size={18} color="#d40000" />
            <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
          </Pressable>

          <Pressable style={styles.contactRow} onPress={() => void Linking.openURL(`tel:${CONTACT_PHONE.replace(/[^0-9+]/g, "")}`)}>
            <FontAwesome name="phone" size={18} color="#d40000" />
            <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => void openEmailApp("DFF Inquiry", "")}> 
            <Text style={styles.secondaryBtnText}>{t.openEmail}</Text>
          </Pressable>
        </LinearGradient>

        <View
          style={[
            styles.formCard,
            { backgroundColor: isDark ? "#171321" : "#ffffff", borderColor: isDark ? "#2a2338" : "#ece5e7" },
          ]}
        >
          <Text style={[styles.formTitle, { color: isDark ? "#fff" : "#0f0f16" }]}>{t.messageTitle}</Text>
          <Text style={[styles.formSub, { color: isDark ? "#cfc8dd" : "#55515d" }]}>{t.messageHelp}</Text>
          <Text style={[styles.formSub, { marginTop: 14, color: isDark ? "#cfc8dd" : "#55515d" }]}>{t.required}</Text>

          <Text style={[styles.label, { color: isDark ? "#f4f1fb" : "#222" }]}>{t.name}</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#2e2a39",
                borderColor: isDark ? "#2f2743" : "#ece5f7",
                backgroundColor: isDark ? "#241d31" : "#f2edf9",
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder={isFrench ? "Votre nom" : "Your name"}
            placeholderTextColor="#8a8198"
          />

          <Text style={[styles.label, { color: isDark ? "#f4f1fb" : "#222" }]}>{t.email}</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#2e2a39",
                borderColor: isDark ? "#2f2743" : "#ece5f7",
                backgroundColor: isDark ? "#241d31" : "#f2edf9",
              },
            ]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={isFrench ? "Votre courriel" : "Your email"}
            placeholderTextColor="#8a8198"
          />

          <Text style={[styles.label, { color: isDark ? "#f4f1fb" : "#222" }]}>{t.msg}</Text>
          <TextInput
            style={[
              styles.input,
              styles.messageInput,
              {
                color: isDark ? "#fff" : "#2e2a39",
                borderColor: isDark ? "#2f2743" : "#ece5f7",
                backgroundColor: isDark ? "#241d31" : "#f2edf9",
              },
            ]}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder={isFrench ? "Votre message" : "Your message"}
            placeholderTextColor="#8a8198"
          />

          <Pressable style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]} onPress={() => void onSubmitForm()} disabled={isSubmitting}>
            <Text style={styles.primaryBtnText}>{isSubmitting ? "Submitting..." : t.submit}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 30 },
  hero: { borderRadius: 16, padding: 18, borderWidth: 1 },
  heroTitle: { fontSize: 38, fontWeight: "900", marginBottom: 10 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  contactValue: { fontSize: 19, fontWeight: "800", flexShrink: 1, color: "#111111" },
  secondaryBtn: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d40000",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryBtnText: { color: "#d40000", fontWeight: "800" },
  formCard: { marginTop: 14, borderRadius: 16, borderWidth: 1, padding: 16 },
  formTitle: { fontSize: 34, fontWeight: "900" },
  formSub: { marginTop: 8, fontSize: 16, lineHeight: 24 },
  label: { marginTop: 12, fontSize: 12, fontWeight: "700" },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  messageInput: { minHeight: 130 },
  primaryBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
