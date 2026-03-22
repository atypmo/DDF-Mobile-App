import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const t = {
    kicker: isFrench ? "Connexion" : "Connect",
    title: isFrench ? "Contacter DFF" : "Contact DFF",
    sub: isFrench ? "Questions, partenariats ou soutien." : "Questions, partnerships, or support. We are here to help.",
    send: isFrench ? "Envoyer un message" : "Send Message",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={isDark ? ["#1c1626", "#2a1d16"] : ["#ffffff", "#f3edf9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderWidth: 1, borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}>
          <Text style={styles.heroKicker}>{t.kicker}</Text>
          <Text style={[styles.heroTitle, { color: isDark ? "#fff" : "#1f1730" }]}>{t.title}</Text>
          <Text style={[styles.heroSub, { color: isDark ? "#ccc5db" : "#5f566d" }]}>{t.sub}</Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}>
          <View style={styles.contactRow}><FontAwesome name="envelope" size={16} color="#d40000" /><Text style={[styles.contactText, { color: isDark ? "#f7f3ff" : "#332c42" }]}>info@dforbesfoundation.com</Text></View>
          <View style={styles.contactRow}><FontAwesome name="phone" size={16} color="#d40000" /><Text style={[styles.contactText, { color: isDark ? "#f7f3ff" : "#332c42" }]}>+1 (905) 805-0214</Text></View>
          <Pressable style={styles.button}><Text style={styles.buttonText}>{t.send}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 18, paddingBottom: 28 }, hero: { borderRadius: 18, padding: 18 }, heroKicker: { color: "#d40000", fontSize: 12, fontWeight: "800", letterSpacing: 1 }, heroTitle: { marginTop: 6, fontSize: 30, fontWeight: "800" }, heroSub: { marginTop: 6, fontSize: 15, lineHeight: 22 }, card: { marginTop: 14, borderRadius: 16, padding: 15, borderWidth: 1 }, contactRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }, contactText: { fontSize: 15, fontWeight: "600" }, button: { marginTop: 16, backgroundColor: "#d40000", borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center" }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 } });
