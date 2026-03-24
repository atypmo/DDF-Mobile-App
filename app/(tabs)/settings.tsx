import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";
import { TAB_TUTORIAL_SLIDES } from "@/lib/tab-tutorial";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MenuItem = {
  key: string;
  icon: keyof typeof FontAwesome.glyphMap;
  labelEn: string;
  labelFr: string;
};

const ACCOUNT_ITEMS: MenuItem[] = [
  {
    key: "account-status",
    icon: "check-circle",
    labelEn: "Account Status",
    labelFr: "Statut du compte",
  },
  {
    key: "sms-2fa",
    icon: "mobile",
    labelEn: "SMS 2-Step Verification",
    labelFr: "Verification SMS a 2 etapes",
  },
  {
    key: "privacy-center",
    icon: "shield",
    labelEn: "Privacy Center",
    labelFr: "Centre de confidentialite",
  },
  { key: "about", icon: "info-circle", labelEn: "About", labelFr: "A propos" },
  {
    key: "refer",
    icon: "share-alt",
    labelEn: "Refer a Friend",
    labelFr: "Parrainer un ami",
  },
];

const SUPPORT_ITEMS: MenuItem[] = [
  { key: "help", icon: "question-circle", labelEn: "Help", labelFr: "Aide" },
  {
    key: "app-tour",
    icon: "compass",
    labelEn: "App Tour",
    labelFr: "Visite guidee",
  },
];

export default function SettingsTab() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
  const { themeMode, isDark, persistTheme } = useAppTheme();
  const { language, isFrench, persistLanguage } = useAppLanguage();

  useFocusEffect(
    useCallback(() => {
      const loadMfaStatus = async () => {
        const { data } = await supabase.auth.mfa.listFactors();
        const hasSms = (data?.all ?? []).some(
          (factor) =>
            factor.factor_type === "phone" && factor.status === "verified",
        );
        setIsSmsEnabled(hasSms);
      };
      void loadMfaStatus();
    }, []),
  );

  const text = {
    preferences: isFrench ? "Preferences" : "Preferences",
    settings: isFrench ? "Parametres" : "Settings",
    subtitle: isFrench
      ? "Gerez votre compte et votre experience dans l'application."
      : "Manage your account and app experience.",
    displayMode: isFrench ? "Mode d'affichage" : "Display Mode",
    languageLabel: isFrench ? "Langue" : "Language",
    accessibility: isFrench ? "Accessibilite" : "Accessibility",
    accountSection: isFrench ? "Compte" : "Account",
    supportSection: isFrench ? "Support" : "Support",
    tutorialSection: isFrench ? "Tutoriel des onglets" : "Tab Tutorial",
    tutorialSubtitle: isFrench
      ? "Decouvrez le role de chaque onglet et la meilleure facon de l'utiliser."
      : "See what each tab does and the best way to use it.",
    tutorialReplay: isFrench ? "Relancer la visite guidee" : "Replay App Tour",
    dark: isFrench ? "Sombre" : "Dark",
    light: isFrench ? "Clair" : "Light",
    english: "English",
    french: "Francais",
    logout: isFrench ? "Se deconnecter" : "Log Out",
    loggingOut: isFrench ? "Deconnexion..." : "Logging out...",
    smsStatus: isFrench
      ? isSmsEnabled
        ? "SMS 2 etapes active"
        : "SMS 2 etapes non configuree"
      : isSmsEnabled
        ? "SMS 2-step is enabled"
        : "SMS 2-step is not set up",
    smsAction: isFrench
      ? isSmsEnabled
        ? "Mettre a jour SMS"
        : "Configurer SMS"
      : isSmsEnabled
        ? "Manage SMS"
        : "Set up SMS",
  };

  const onMenuPress = (label: string, key: string) => {
    if (key === "sms-2fa") {
      router.push("/mfa-setup");
      return;
    }
    if (key === "app-tour") {
      router.push({
        pathname: "/(tabs)/home",
        params: { tutorial: Date.now().toString() },
      });
      return;
    }
    Alert.alert(
      label,
      isFrench
        ? "Cette section sera disponible bientot."
        : "This section will be available soon.",
    );
  };

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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0f0c15" : "#f6f2f8" },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={isDark ? ["#1c1626", "#261616"] : ["#ffffff", "#f4edf8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            { borderWidth: 1, borderColor: isDark ? "#2a2338" : "#ece0f1" },
          ]}
        >
          <Text style={[styles.heroKicker, { color: "#d40000" }]}>
            {text.preferences}
          </Text>
          <Text
            style={[styles.heroTitle, { color: isDark ? "#fff" : "#1c1526" }]}
          >
            {text.settings}
          </Text>
          <Text
            style={[styles.heroSub, { color: isDark ? "#ccc5db" : "#5f566d" }]}
          >
            {text.subtitle}
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#20172d" },
            ]}
          >
            {text.displayMode}
          </Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, themeMode === "dark" && styles.chipActive]}
              onPress={() => void persistTheme("dark")}
            >
              <FontAwesome
                name="moon-o"
                size={14}
                color={themeMode === "dark" ? "#fff" : "#6b617d"}
              />
              <Text
                style={[
                  styles.chipText,
                  themeMode === "dark" && styles.chipTextActive,
                ]}
              >
                {text.dark}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.chip, themeMode === "light" && styles.chipActive]}
              onPress={() => void persistTheme("light")}
            >
              <FontAwesome
                name="sun-o"
                size={14}
                color={themeMode === "light" ? "#fff" : "#6b617d"}
              />
              <Text
                style={[
                  styles.chipText,
                  themeMode === "light" && styles.chipTextActive,
                ]}
              >
                {text.light}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#20172d" },
            ]}
          >
            {text.accessibility}
          </Text>
          <Text
            style={[styles.rowLabel, { color: isDark ? "#c8c1d8" : "#6d6380" }]}
          >
            {text.languageLabel}
          </Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, language === "en" && styles.chipActive]}
              onPress={() => void persistLanguage("en")}
            >
              <Text
                style={[
                  styles.chipText,
                  language === "en" && styles.chipTextActive,
                ]}
              >
                {text.english}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chip, language === "fr" && styles.chipActive]}
              onPress={() => void persistLanguage("fr")}
            >
              <Text
                style={[
                  styles.chipText,
                  language === "fr" && styles.chipTextActive,
                ]}
              >
                {text.french}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#20172d" },
            ]}
          >
            {text.accountSection}
          </Text>
          <View style={styles.smsCard}>
            <View style={styles.smsTextWrap}>
              <Text
                style={[
                  styles.smsTitle,
                  { color: isDark ? "#fff" : "#20172d" },
                ]}
              >
                SMS 2-Step Verification
              </Text>
              <Text
                style={[
                  styles.smsSub,
                  { color: isDark ? "#c8c1d8" : "#6d6380" },
                ]}
              >
                {text.smsStatus}
              </Text>
            </View>
            <Pressable
              style={styles.smsBtn}
              onPress={() => router.push("/mfa-setup")}
            >
              <Text style={styles.smsBtnText}>{text.smsAction}</Text>
            </Pressable>
          </View>
          {ACCOUNT_ITEMS.map((item) => {
            const label = isFrench ? item.labelFr : item.labelEn;
            return (
              <Pressable
                key={item.key}
                style={styles.menuRow}
                onPress={() =>
                  item.key === "sms-2fa"
                    ? router.push("/mfa-setup")
                    : onMenuPress(label, item.key)
                }
              >
                <FontAwesome name={item.icon} size={16} color="#d40000" />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: isDark ? "#f7f3ff" : "#332c42" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#20172d" },
            ]}
          >
            {text.supportSection}
          </Text>
          {SUPPORT_ITEMS.map((item) => {
            const label = isFrench ? item.labelFr : item.labelEn;
            return (
              <Pressable
                key={item.key}
                style={styles.menuRow}
                onPress={() => onMenuPress(label, item.key)}
              >
                <FontAwesome name={item.icon} size={16} color="#d40000" />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: isDark ? "#f7f3ff" : "#332c42" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#fff" : "#20172d" },
            ]}
          >
            {text.tutorialSection}
          </Text>
          <Text
            style={[
              styles.sectionCaption,
              { color: isDark ? "#c8c1d8" : "#6d6380" },
            ]}
          >
            {text.tutorialSubtitle}
          </Text>

          {TAB_TUTORIAL_SLIDES.map((item) => (
            <View
              key={item.key}
              style={[
                styles.tutorialRow,
                {
                  backgroundColor: isDark ? "#211a2e" : "#faf7fc",
                  borderColor: isDark ? "#2f2740" : "#ece0f1",
                },
              ]}
            >
              <View style={styles.tutorialIconWrap}>
                <FontAwesome name={item.icon} size={16} color="#d40000" />
              </View>
              <View style={styles.tutorialTextWrap}>
                <Text
                  style={[
                    styles.tutorialTitle,
                    { color: isDark ? "#fff" : "#20172d" },
                  ]}
                >
                  {isFrench ? item.titleFr : item.titleEn}
                </Text>
                <Text
                  style={[
                    styles.tutorialSummary,
                    { color: isDark ? "#c8c1d8" : "#6d6380" },
                  ]}
                >
                  {isFrench ? item.summaryFr : item.summaryEn}
                </Text>
                <Text
                  style={[
                    styles.tutorialHowTo,
                    { color: isDark ? "#eee7fb" : "#433a54" },
                  ]}
                >
                  {isFrench ? item.howToFr : item.howToEn}
                </Text>
              </View>
            </View>
          ))}

          <Pressable
            style={styles.tutorialReplayButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/home",
                params: { tutorial: Date.now().toString() },
              })
            }
          >
            <FontAwesome name="compass" size={16} color="#fff" />
            <Text style={styles.tutorialReplayText}>{text.tutorialReplay}</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? text.loggingOut : text.logout}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  hero: { borderRadius: 18, padding: 18 },
  heroKicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { marginTop: 6, fontSize: 30, fontWeight: "800" },
  heroSub: { marginTop: 6, fontSize: 15, lineHeight: 22 },

  card: {
    marginTop: 14,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionCaption: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  rowLabel: { marginTop: 8, fontSize: 13, fontWeight: "600" },

  chipRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbd3e8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f4f0fa",
  },
  chipActive: {
    backgroundColor: "#d40000",
    borderColor: "#d40000",
  },
  chipText: {
    color: "#6b617d",
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  tutorialRow: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  tutorialIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(212, 0, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tutorialTextWrap: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  tutorialSummary: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  tutorialHowTo: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  tutorialReplayButton: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tutorialReplayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  smsCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e7d9ea",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff7f7",
  },
  smsTextWrap: {
    marginBottom: 10,
  },
  smsTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  smsSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  smsBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#d40000",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smsBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  logoutButton: {
    marginTop: 16,
    backgroundColor: "#d40000",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
