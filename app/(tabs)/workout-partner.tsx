import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutPartnerTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const t = {
    kicker: isFrench ? "Bien-etre" : "Wellness",
    title: isFrench ? "Partenaire d'entrainement" : "Workout Partner",
    sub: isFrench ? "Trouvez quelqu'un qui partage vos objectifs." : "Match with someone who shares your goals and schedule.",
    suggested: isFrench ? "Suggestion" : "Suggested Match",
    group: isFrench ? "Groupe debutant force" : "Beginner Strength Group",
    meta: isFrench ? "3 membres • Soirees • Mississauga" : "3 members • Evenings • Mississauga",
    request: isFrench ? "Demander un match" : "Request Match",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={isDark ? ["#1c1626", "#16262a"] : ["#ffffff", "#f3edf9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderWidth: 1, borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}
        >
          <Text style={styles.heroKicker}>{t.kicker}</Text>
          <Text style={[styles.heroTitle, { color: isDark ? "#fff" : "#1f1730" }]}>{t.title}</Text>
          <Text style={[styles.heroSub, { color: isDark ? "#ccc5db" : "#5f566d" }]}>{t.sub}</Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}>
          <View style={styles.row}><FontAwesome name="users" size={18} color="#d40000" /><Text style={[styles.cardTitle, { color: isDark ? "#f8f5ff" : "#251d35" }]}>{t.suggested}</Text></View>
          <Text style={[styles.itemTitle, { color: isDark ? "#fff" : "#1f1730" }]}>{t.group}</Text>
          <Text style={[styles.itemMeta, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{t.meta}</Text>
          <Pressable style={styles.button}><Text style={styles.buttonText}>{t.request}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 18, paddingBottom: 28 }, hero: { borderRadius: 18, padding: 18 }, heroKicker: { color: "#d40000", fontSize: 12, fontWeight: "800", letterSpacing: 1 }, heroTitle: { marginTop: 6, fontSize: 30, fontWeight: "800" }, heroSub: { marginTop: 6, fontSize: 15, lineHeight: 22 }, card: { marginTop: 14, borderRadius: 16, padding: 15, borderWidth: 1 }, row: { flexDirection: "row", alignItems: "center", gap: 8 }, cardTitle: { fontSize: 16, fontWeight: "700" }, itemTitle: { marginTop: 10, fontSize: 20, fontWeight: "800" }, itemMeta: { marginTop: 4, fontSize: 14 }, button: { marginTop: 12, backgroundColor: "#d40000", borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center" }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 } });
