import { router, useLocalSearchParams } from "expo-router";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function PersonaScreen() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const { firstTime } = useLocalSearchParams<{ firstTime?: string }>();
  const isFirstTime = firstTime === "true";
  const t = {
    title: isFrench ? "Persona Utilisateur" : "User Persona",
    intro: isFrench
      ? "Bienvenue. Creons votre persona pour personnaliser votre experience."
      : "Welcome. Let's create your persona so your app experience is tailored to you.",
    manage: isFrench
      ? "Affichez et gerez votre profil persona."
      : "View and manage your persona profile.",
    create: isFrench ? "Creer Persona" : "Create Persona",
    back: isFrench ? "Retour a l'accueil" : "Back to Home",
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <View style={[styles.card, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#171321" }]}>{t.title}</Text>
        <Text style={[styles.subtitle, { color: isDark ? "#cec7dd" : "#4f4761" }]}>
          {isFirstTime ? t.intro : t.manage}
        </Text>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{t.create}</Text>
        </Pressable>

        <Pressable style={[styles.secondaryButton, { backgroundColor: isDark ? "#241d31" : "#efe9fa" }]} onPress={() => router.back()}>
          <Text style={[styles.secondaryButtonText, { color: isDark ? "#ddd5eb" : "#3d3450" }]}>{t.back}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f2f8",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#efe9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
