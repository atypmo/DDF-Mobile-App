import { supabase } from "@/lib/supabase";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ABOUT_TEXT =
  "We empower Caribbean & African Diaspora communities and their descendants to build generational wealth, wisdom, and progression through a range of initiatives, including tailored programs, skill development workshops, educational seminars, community events, and essential living needs support";

const IMPACT_TEXT =
  "We've worked on improving the lives of over 25,000 individuals through direct practice. Our numbers tell a story of growth and success, driving us to continuously improve and break our own records. However, we see beyond the statistics; each number represents an individual we care about. We are dedicated to making a positive impact on every person we interact with, ensuring that our growth translates into meaningful support and assistance for our community.";

const VIDEO_ITEMS = [
  {
    id: "short",
    label: "DFF Short Highlight",
    type: "Short",
    thumbnail: "https://img.youtube.com/vi/XAafkQQkDFQ/hqdefault.jpg",
    openUrl: "https://www.youtube.com/shorts/XAafkQQkDFQ",
  },
  {
    id: "full",
    label: "DFF Full Video",
    type: "Video",
    thumbnail: "https://img.youtube.com/vi/MtSKodqagms/hqdefault.jpg",
    openUrl: "https://www.youtube.com/watch?v=MtSKodqagms",
  },
] as const;

type InfoKey = "about" | "impact";

export default function HomeTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const [firstName, setFirstName] = useState("Member");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeInfo, setActiveInfo] = useState<InfoKey | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;
      setUserId(user.id);

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
  const text = {
    home: isFrench ? "Accueil" : "Home",
    quickOverview: isFrench ? "Apercu rapide" : "Quick Overview",
    hello: isFrench ? "Bonjour" : "Hello",
    subtitle: isFrench ? "Continuons a construire votre avenir." : "Let's keep building your future.",
    about: isFrench ? "A propos de DFF" : "About DFF",
    impact: isFrench ? "Notre impact" : "Our Impact",
    upcoming: isFrench ? "Evenements a venir" : "Upcoming Events",
    upcomingSub: isFrench ? "Consultez les sessions a venir et ouvrez l'onglet Evenements." : "See upcoming sessions and open the Events tab.",
    youtubeTitle: isFrench ? "DFF sur YouTube" : "DFF on YouTube",
    youtubeSub: isFrench ? "Une courte video et une video complete. Touchez pour regarder sur YouTube." : "One short and one full video. Tap to watch on YouTube.",
    watchYoutube: isFrench ? "Regarder sur YouTube" : "Watch on YouTube",
  };
  const handleProfilePress = async () => {
    if (!userId) {
      router.push("/persona");
      return;
    }

    const key = `persona_prompt_seen_${userId}`;
    const seenPrompt = await AsyncStorage.getItem(key);

    if (!seenPrompt) {
      await AsyncStorage.setItem(key, "true");
      router.push("/persona?firstTime=true");
      return;
    }

    router.push("/persona");
  };
  const openYoutube = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleProfilePress} hitSlop={10}>
            <FontAwesome name="user-circle-o" size={24} color={isDark ? "#d7d1e4" : "#2c2c2c"} />
          </Pressable>
          <View style={styles.headerIcons}>
            <FontAwesome name="bell-o" size={22} color={isDark ? "#d7d1e4" : "#2c2c2c"} />
            <FontAwesome name="cog" size={22} color={isDark ? "#d7d1e4" : "#2c2c2c"} />
          </View>
        </View>

        <Text style={[styles.title, { color: isDark ? "#fff" : "#16131f" }]}>{text.home}</Text>
        <Text style={[styles.sectionHeading, { color: "#d40000" }]}>{text.quickOverview}</Text>

        <Text style={[styles.greeting, { color: isDark ? "#fff" : "#16131f" }]}>{text.hello}, {firstName}!</Text>
        <Text style={[styles.sub, { color: isDark ? "#cbc5d8" : "#4a445b" }]}>{text.subtitle}</Text>

        <View style={styles.infoActionsRow}>
          <Pressable
            style={[
              styles.infoChip,
              { backgroundColor: isDark ? "#2a2237" : "#ece4f3" },
              activeInfo === "about" && styles.infoChipActive,
            ]}
            onPress={() => setActiveInfo((prev) => (prev === "about" ? null : "about"))}
          >
            <Text
              style={[
                styles.infoChipText,
                { color: isDark ? "#e8e2f7" : "#2f2840" },
                activeInfo === "about" && styles.infoChipTextActive,
              ]}
            >
              {text.about}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.infoChip,
              { backgroundColor: isDark ? "#2a2237" : "#ece4f3" },
              activeInfo === "impact" && styles.infoChipActive,
            ]}
            onPress={() => setActiveInfo((prev) => (prev === "impact" ? null : "impact"))}
          >
            <Text
              style={[
                styles.infoChipText,
                { color: isDark ? "#e8e2f7" : "#2f2840" },
                activeInfo === "impact" && styles.infoChipTextActive,
              ]}
            >
              {text.impact}
            </Text>
          </Pressable>
        </View>

        {activeInfo ? (
          <View style={[styles.infoPanel, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}>
            <Text style={[styles.infoPanelTitle, { color: isDark ? "#fff" : "#1a1723" }]}>{infoTitle}</Text>
            <Text style={[styles.infoPanelBody, { color: isDark ? "#cec7dd" : "#4f4761" }]}>{infoBody}</Text>
          </View>
        ) : null}

        <Pressable style={[styles.featureCard, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3", borderWidth: 1 }]} onPress={() => router.push("/(tabs)/events")}>
          <Text style={[styles.featureTitle, { color: isDark ? "#fff" : "#1a1723" }]}>{text.upcoming}</Text>
          <Text style={[styles.featureSub, { color: isDark ? "#cec7dd" : "#4f4761" }]}>{text.upcomingSub}</Text>
        </Pressable>

        <View style={[styles.videoSection, { backgroundColor: isDark ? "#1b1724" : "#ffffff", borderColor: isDark ? "#2a2338" : "#ebe2f3", borderWidth: 1 }]}>
          <Text style={styles.videoTitle}>{text.youtubeTitle}</Text>
          <Text style={[styles.videoSub, { color: isDark ? "#cbc3dc" : "#5f566d" }]}>{text.youtubeSub}</Text>

          {VIDEO_ITEMS.map((video) => {
            return (
              <View key={video.id} style={[styles.videoCard, { backgroundColor: isDark ? "#2b2438" : "#f5eefb" }]}>
                <View style={styles.videoCardHeader}>
                  <Text style={styles.videoCardTitle}>{video.label}</Text>
                  <Text style={styles.videoPill}>{video.type}</Text>
                </View>

                <Pressable onPress={() => openYoutube(video.openUrl)} style={styles.thumbnailWrap}>
                  <Image source={video.thumbnail} style={styles.thumbnail} contentFit="cover" />
                  <View style={styles.playOverlay}>
                    <FontAwesome name="play-circle" size={44} color="#ffffff" />
                  </View>
                </Pressable>

                <Pressable style={styles.loadVideoButton} onPress={() => openYoutube(video.openUrl)}>
                  <FontAwesome name="youtube-play" size={18} color="#fff" />
                  <Text style={styles.loadVideoButtonText}>{text.watchYoutube}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0c15" },
  content: { padding: 20, paddingBottom: 24 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  headerIcons: { flexDirection: "row", gap: 16 },
  title: { fontSize: 42, fontWeight: "800", color: "#ffffff" },
  sectionHeading: { marginTop: 12, fontSize: 26, fontWeight: "800", color: "#d40000" },
  greeting: { marginTop: 16, fontSize: 34, fontWeight: "800", color: "#ffffff" },
  sub: { marginTop: 6, fontSize: 18, color: "#cbc5d8", lineHeight: 26 },
  infoActionsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  infoChip: {
    backgroundColor: "#2a2237",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoChipActive: {
    backgroundColor: "#d40000",
  },
  infoChipText: {
    color: "#e8e2f7",
    fontSize: 13,
    fontWeight: "700",
  },
  infoChipTextActive: {
    color: "#20172d",
  },
  infoPanel: {
    marginTop: 12,
    backgroundColor: "#171321",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2338",
  },
  infoPanelTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  infoPanelBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#cec7dd",
  },
  featureCard: {
    marginTop: 16,
    backgroundColor: "#171321",
    borderRadius: 18,
    padding: 18,
  },
  featureTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  featureSub: { marginTop: 6, fontSize: 18, color: "#cec7dd" },
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
  videoCard: {
    marginTop: 12,
    backgroundColor: "#2b2438",
    borderRadius: 14,
    padding: 12,
  },
  videoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  videoCardTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  videoPill: {
    color: "#1b1724",
    backgroundColor: "#ffe2e2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
  },
  thumbnailWrap: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    height: 190,
    backgroundColor: "#000",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadVideoButton: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadVideoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

