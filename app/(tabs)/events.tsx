import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EventItem = {
  id: string;
  title: string;
  titleFr: string;
  dateLabel: string;
  registerUrl: string;
  imageUrl?: string;
};

const CURRENT_EVENTS: EventItem[] = [
  {
    id: "upcoming-placeholder-1",
    title: "Current events will appear here",
    titleFr: "Les evenements en cours apparaitront ici",
    dateLabel: "Admin-managed feed (coming soon)",
    registerUrl: "https://dforbesfoundation.com/#events",
  },
];

const PAST_EVENTS: EventItem[] = [
  {
    id: "strive",
    title: "Strive for Greatness",
    titleFr: "Strive for Greatness",
    dateLabel: "September 27, 2025",
    registerUrl: "https://dforbesfoundation.com/#events",
  },
  {
    id: "health-pop-up",
    title: "Health and Wellness Pop-Up Shop",
    titleFr: "Kiosque Sante et Bien-etre",
    dateLabel: "April 25-26, 2025",
    registerUrl: "https://dforbesfoundation.com/#events",
  },
  {
    id: "glow-bowling",
    title: "Glow in the Dark Bowling Fundraiser",
    titleFr: "Collecte Glow in the Dark Bowling",
    dateLabel: "March 21, 2025",
    registerUrl: "https://dforbesfoundation.com/#events",
  },
  {
    id: "paint-sip",
    title: "Paint and Sip",
    titleFr: "Paint and Sip",
    dateLabel: "Completed Event",
    registerUrl: "https://www.ticketgateway.com/event/completed/dff-inc--paint---sip",
  },
];

export default function EventsTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();

  const text = {
    title: isFrench ? "Evenements" : "Events",
    current: isFrench ? "Evenements en cours" : "Current Events",
    past: isFrench ? "Evenements passes" : "Past Events",
    open: isFrench ? "Voir" : "Register",
  };

  const openExternal = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const renderEventCard = (item: EventItem) => {
    const label = isFrench ? item.titleFr : item.title;

    return (
      <View key={item.id} style={[styles.eventCard, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}>
        {item.imageUrl ? (
          <Image source={item.imageUrl} style={styles.poster} contentFit="cover" />
        ) : (
          <View style={[styles.posterFallback, { backgroundColor: isDark ? "#2a2237" : "#efe7f7" }]}>
            <FontAwesome name="calendar" size={22} color="#d40000" />
          </View>
        )}

        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: isDark ? "#fff" : "#1f1730" }]}>{label}</Text>
          <Text style={[styles.eventDate, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{item.dateLabel}</Text>
          <Pressable style={styles.registerButton} onPress={() => openExternal(item.registerUrl)}>
            <Text style={styles.registerText}>{text.open}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: isDark ? "#fff" : "#171321" }]}>{text.title}</Text>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#20172d" }]}>{text.current}</Text>
          {CURRENT_EVENTS.map(renderEventCard)}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#20172d" }]}>{text.past}</Text>
          {PAST_EVENTS.map(renderEventCard)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  screenTitle: { fontSize: 34, fontWeight: "800" },
  sectionBlock: { marginTop: 14 },
  sectionTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },

  eventCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  poster: { width: 82, height: 108, borderRadius: 10, backgroundColor: "#1a1525" },
  posterFallback: {
    width: 82,
    height: 108,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 24, fontWeight: "800", lineHeight: 30 },
  eventDate: { marginTop: 4, fontSize: 14 },
  registerButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#d40000",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  registerText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
