import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const ABOUT_TEXT =
  "Dominance Forbes Foundation (DFF) supports youth and communities through mentorship, wellness, leadership, and opportunity-building programs. We focus on confidence, real support systems, and long-term growth pathways.";

const IMPACT_TEXT =
  "DFF's impact includes mentorship touchpoints, wellness engagement, educational support, and strategic community partnerships. Through events and programming, DFF works to create measurable and lasting outcomes.";

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/videoseries?list=UU";

type InfoKey = "about" | "impact";

export default function HomeTab() {
  const [firstName, setFirstName] = useState("Member");
  const [activeInfo, setActiveInfo] = useState<InfoKey | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (isMounted && data?.first_name?.trim()) {
        setFirstName(data.first_name.trim());
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const infoTitle = activeInfo === "about" ? "About DFF" : activeInfo === "impact" ? "Our Impact" : "";
  const infoBody = activeInfo === "about" ? ABOUT_TEXT : activeInfo === "impact" ? IMPACT_TEXT : "";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <FontAwesome name="user-circle-o" size={24} color="#2c2c2c" />
          <View style={styles.headerIcons}>
            <FontAwesome name="bell-o" size={22} color="#2c2c2c" />
            <FontAwesome name="cog" size={22} color="#2c2c2c" />
          </View>
        </View>

        <Text style={styles.title}>Home</Text>
        <Text style={styles.sectionHeading}>Quick Overview</Text>

        <Text style={styles.greeting}>Hello, {firstName}!</Text>
        <Text style={styles.sub}>Let's keep building your future.</Text>

        <View style={styles.infoActionsRow}>
          <Pressable
            style={[styles.infoChip, activeInfo === "about" && styles.infoChipActive]}
            onPress={() => setActiveInfo((prev) => (prev === "about" ? null : "about"))}
          >
            <Text style={[styles.infoChipText, activeInfo === "about" && styles.infoChipTextActive]}>
              About DFF
            </Text>
          </Pressable>

          <Pressable
            style={[styles.infoChip, activeInfo === "impact" && styles.infoChipActive]}
            onPress={() => setActiveInfo((prev) => (prev === "impact" ? null : "impact"))}
          >
            <Text style={[styles.infoChipText, activeInfo === "impact" && styles.infoChipTextActive]}>
              Our Impact
            </Text>
          </Pressable>
        </View>

        {activeInfo ? (
          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelTitle}>{infoTitle}</Text>
            <Text style={styles.infoPanelBody}>{infoBody}</Text>
          </View>
        ) : null}

        <Pressable style={styles.featureCard} onPress={() => router.push("/(tabs)/events")}>
          <Text style={styles.featureTitle}>Upcoming Events</Text>
          <Text style={styles.featureSub}>See upcoming sessions and open the Events tab.</Text>
        </Pressable>

        <View style={styles.videoSection}>
          <Text style={styles.videoTitle}>DFF on YouTube</Text>
          <Text style={styles.videoSub}>Watch directly inside the app.</Text>

          <View style={styles.videoFrame}>
            <WebView
              source={{ uri: YOUTUBE_EMBED_URL }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f2f8" },
  content: { padding: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerIcons: { flexDirection: "row", gap: 16 },
  title: { fontSize: 42, fontWeight: "800", color: "#16131f" },
  sectionHeading: { marginTop: 12, fontSize: 28, fontWeight: "800", color: "#16131f" },
  greeting: { marginTop: 16, fontSize: 36, fontWeight: "800", color: "#16131f" },
  sub: { marginTop: 6, fontSize: 19, color: "#252130", lineHeight: 27 },
  infoActionsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  infoChip: {
    backgroundColor: "#e9e3f0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoChipActive: {
    backgroundColor: "#d40000",
  },
  infoChipText: {
    color: "#2f2840",
    fontSize: 13,
    fontWeight: "700",
  },
  infoChipTextActive: {
    color: "#fff",
  },
  infoPanel: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee6f7",
  },
  infoPanelTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1723",
  },
  infoPanelBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#4f4761",
  },
  featureCard: {
    marginTop: 16,
    backgroundColor: "#e9e3f0",
    borderRadius: 18,
    padding: 18,
  },
  featureTitle: { fontSize: 28, fontWeight: "800", color: "#1a1723" },
  featureSub: { marginTop: 6, fontSize: 18, color: "#33303f" },
  videoSection: {
    marginTop: 18,
    backgroundColor: "#1b1724",
    borderRadius: 18,
    padding: 18,
  },
  videoTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  videoSub: {
    marginTop: 6,
    fontSize: 15,
    color: "#cbc3dc",
    lineHeight: 22,
  },
  videoFrame: {
    marginTop: 14,
    borderRadius: 12,
    overflow: "hidden",
    height: 220,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
  },
});
