import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StatCard = {
  labelEn: string;
  labelFr: string;
  value: string;
  icon: keyof typeof FontAwesome.glyphMap;
};

type QueueItem = {
  titleEn: string;
  titleFr: string;
  count: string;
  noteEn: string;
  noteFr: string;
};

type ActionItem = {
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  icon: keyof typeof FontAwesome.glyphMap;
};

const STAT_CARDS: StatCard[] = [
  { labelEn: "Active members", labelFr: "Membres actifs", value: "1,284", icon: "users" },
  { labelEn: "Open requests", labelFr: "Demandes ouvertes", value: "37", icon: "inbox" },
  { labelEn: "Events this month", labelFr: "Evenements ce mois-ci", value: "12", icon: "calendar" },
];

const QUEUE_ITEMS: QueueItem[] = [
  {
    titleEn: "Mental health support",
    titleFr: "Soutien en sante mentale",
    count: "9 pending",
    noteEn: "Newest request arrived 18 minutes ago.",
    noteFr: "La plus recente demande est arrivee il y a 18 minutes.",
  },
  {
    titleEn: "Workout partner matches",
    titleFr: "Correspondances partenaire d'entrainement",
    count: "14 pending",
    noteEn: "3 high-priority requests need assignment.",
    noteFr: "3 demandes prioritaires ont besoin d'une attribution.",
  },
  {
    titleEn: "Member verification",
    titleFr: "Verification des membres",
    count: "6 pending",
    noteEn: "Review new signups before granting access.",
    noteFr: "Examinez les nouvelles inscriptions avant d'accorder l'acces.",
  },
];

const ACTION_ITEMS: ActionItem[] = [
  {
    titleEn: "Review new members",
    titleFr: "Examiner les nouveaux membres",
    descriptionEn: "Approve profiles, confirm onboarding details, and assign access.",
    descriptionFr: "Approuvez les profils, confirmez l'inscription et attribuez l'acces.",
    icon: "user-plus",
  },
  {
    titleEn: "Manage events",
    titleFr: "Gerer les evenements",
    descriptionEn: "Create sessions, update schedules, and publish reminders.",
    descriptionFr: "Creez des sessions, mettez a jour le calendrier et publiez des rappels.",
    icon: "calendar-check-o",
  },
  {
    titleEn: "Broadcast updates",
    titleFr: "Diffuser des mises a jour",
    descriptionEn: "Send organization-wide announcements to the community.",
    descriptionFr: "Envoyez des annonces a toute la communaute.",
    icon: "bullhorn",
  },
];

export default function AdminDashboardScreen() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    const guard = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) {
          router.replace("/login");
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role,is_admin")
          .eq("id", user.id)
          .single();
        const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
        const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
        const isAdmin =
          profile?.role === "admin" ||
          profile?.is_admin === true ||
          metadata.role === "admin" ||
          metadata.is_admin === true ||
          appMetadata.role === "admin" ||
          appMetadata.is_admin === true;

        if (profileError) {
          console.warn("Admin role check fallback to metadata:", profileError.message);
        }
        if (!isAdmin) {
          Alert.alert("Access denied", "Admin access only.");
          router.replace("/(tabs)/home");
          return;
        }
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    void guard();
  }, []);

  const text = {
    kicker: isFrench ? "Portail admin" : "Admin Portal",
    title: isFrench ? "Tableau de bord admin" : "Admin Dashboard",
    subtitle: isFrench
      ? "Surveillez l'activite de la communaute, examinez les demandes et gerez les operations DFF."
      : "Monitor community activity, review requests, and manage DFF operations.",
    queueTitle: isFrench ? "Files d'attente a examiner" : "Queues to Review",
    actionsTitle: isFrench ? "Actions rapides" : "Quick Actions",
    backToLogin: isFrench ? "Retour a la connexion" : "Back to Login",
    openWorkspace: isFrench ? "Ouvrir l'espace admin" : "Open Admin Workspace",
    manageEvents: isFrench ? "Gerer les evenements" : "Manage Events",
  };

  if (isCheckingAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f6f2f8", justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#d40000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f6f2f8" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={isDark ? ["#1a1425", "#3b1212"] : ["#ffffff", "#f8e7e7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: isDark ? "#2a2338" : "#eed7d7" }]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <FontAwesome name="shield" size={14} color="#fff" />
              <Text style={styles.heroBadgeText}>{text.kicker}</Text>
            </View>

            <Pressable
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/login");
                }
              }}
            >
              <FontAwesome name="chevron-left" size={12} color="#7a0a0a" />
              <Text style={styles.backButtonText}>{text.backToLogin}</Text>
            </Pressable>
          </View>

          <Text style={[styles.heroTitle, { color: isDark ? "#fff" : "#221721" }]}>{text.title}</Text>
          <Text style={[styles.heroSub, { color: isDark ? "#d5cedf" : "#5d4f5e" }]}>{text.subtitle}</Text>

          <Pressable style={styles.primaryButton} onPress={() => router.push("/admin-events")}>
            <FontAwesome name="lock" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>{text.manageEvents}</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.statsRow}>
          {STAT_CARDS.map((item) => (
            <View
              key={item.labelEn}
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? "#171321" : "#ffffff",
                  borderColor: isDark ? "#2a2338" : "#ece0f1",
                },
              ]}
            >
              <FontAwesome name={item.icon} size={18} color="#d40000" />
              <Text style={[styles.statValue, { color: isDark ? "#fff" : "#20172d" }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: isDark ? "#c8c1d8" : "#6d6380" }]}>
                {isFrench ? item.labelFr : item.labelEn}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#20172d" }]}>{text.queueTitle}</Text>

          {QUEUE_ITEMS.map((item) => (
            <View key={item.titleEn} style={styles.queueRow}>
              <View style={styles.queueTextWrap}>
                <Text style={[styles.queueTitle, { color: isDark ? "#fff" : "#20172d" }]}>
                  {isFrench ? item.titleFr : item.titleEn}
                </Text>
                <Text style={[styles.queueNote, { color: isDark ? "#c8c1d8" : "#6d6380" }]}>
                  {isFrench ? item.noteFr : item.noteEn}
                </Text>
              </View>
              <View style={styles.queuePill}>
                <Text style={styles.queuePillText}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#171321" : "#ffffff",
              borderColor: isDark ? "#2a2338" : "#ece0f1",
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#20172d" }]}>{text.actionsTitle}</Text>

          {ACTION_ITEMS.map((item) => (
            <Pressable
              key={item.titleEn}
              style={styles.actionRow}
              onPress={() => {
                if (item.titleEn === "Manage events") {
                  router.push("/admin-events");
                }
              }}
            >
              <View style={styles.actionIcon}>
                <FontAwesome name={item.icon} size={16} color="#d40000" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionTitle, { color: isDark ? "#fff" : "#20172d" }]}>
                  {isFrench ? item.titleFr : item.titleEn}
                </Text>
                <Text style={[styles.actionDescription, { color: isDark ? "#c8c1d8" : "#6d6380" }]}>
                  {isFrench ? item.descriptionFr : item.descriptionEn}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={isDark ? "#8f85a3" : "#8f829f"} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 28,
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#d40000",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff4f4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#7a0a0a",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 32,
    fontWeight: "800",
  },
  heroSub: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f0c15",
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  statValue: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  queueRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  queueTextWrap: {
    flex: 1,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  queueNote: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  queuePill: {
    backgroundColor: "#fff0f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  queuePillText: {
    color: "#b00000",
    fontSize: 12,
    fontWeight: "800",
  },
  actionRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
});
