import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Image as RNImage, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EventItem = {
  id: string;
  title: string;
  titleFr: string;
  dateLabel: string;
  registerUrl?: string;
  imageUrl?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  isPast?: boolean;
};

const CURRENT_EVENTS: EventItem[] = [
  {
    id: "upcoming-placeholder-1",
    title: "Current events will appear here",
    titleFr: "Les evenements en cours apparaitront ici",
    dateLabel: "Admin-managed feed (coming soon)",
    registerUrl: "https://dforbesfoundation.com/#events",
    location: "TBD",
    isPast: false,
  },
];

const PAST_EVENTS: EventItem[] = [
  {
    id: "paint-sip",
    title: "Paint and Sip",
    titleFr: "Paint and Sip",
    dateLabel: "Completed Event",
    registerUrl: "https://www.ticketgateway.com/event/completed/dff-inc--paint---sip",
    location: "Mississauga, ON",
    isPast: true,
  },
];

export default function EventsTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const [dbEvents, setDbEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("id,title,title_fr,start_at,end_at,location,register_url,image_url,is_published")
      .eq("is_published", true)
      .order("start_at", { ascending: true });

    if (error || !data) {
      setIsLoading(false);
      return;
    }

    const mapped: EventItem[] = await Promise.all(data.map(async (item: any) => {
      const safeImageUrl = await resolveEventImageUrl(item.image_url);
      const safeRegisterUrl =
        typeof item.register_url === "string" && /^https?:\/\//i.test(item.register_url.trim())
          ? item.register_url.trim()
          : undefined;

      return {
        id: item.id,
        title: item.title ?? "Event",
        titleFr: item.title_fr ?? item.title ?? "Evenement",
        dateLabel: item.start_at
          ? new Date(item.start_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Date TBD",
        registerUrl: safeRegisterUrl,
        imageUrl: safeImageUrl,
        startAt: item.start_at ?? undefined,
        endAt: item.end_at ?? undefined,
        location: item.location ?? undefined,
      };
    }));

    setDbEvents(mapped);
    setFailedImages({});
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [loadEvents])
  );

  const text = {
    title: isFrench ? "Evenements" : "Events",
    current: isFrench ? "Evenements en cours" : "Current Events",
    past: isFrench ? "Evenements passes" : "Past Events",
    open: isFrench ? "Voir" : "View Details",
    register: isFrench ? "S'inscrire" : "Open Ticket Link",
    close: isFrench ? "Fermer" : "Close",
    when: isFrench ? "Quand" : "When",
    where: isFrench ? "Lieu" : "Location",
    type: isFrench ? "Type" : "Type",
    noLink: isFrench ? "Aucun lien d'inscription fourni" : "No ticket link provided",
    pastEvent: isFrench ? "Evenement passe" : "Past Event",
    currentEvent: isFrench ? "Evenement en cours" : "Current Event",
  };

  const upcomingFromDb = useMemo(() => {
    const now = Date.now();
    return dbEvents.filter((e) => {
      if (!e.startAt) return true;
      const ts = Date.parse(e.startAt);
      const result = Number.isFinite(ts) ? ts >= now : true;
      e.isPast = !result;
      return result;
    });
  }, [dbEvents]);

  const pastFromDb = useMemo(() => {
    const now = Date.now();
    return dbEvents.filter((e) => {
      if (!e.startAt) return false;
      const ts = Date.parse(e.startAt);
      const result = Number.isFinite(ts) ? ts < now : false;
      e.isPast = result;
      return result;
    });
  }, [dbEvents]);

  const openExternal = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const formatRange = (event: EventItem) => {
    if (!event.startAt) return event.dateLabel;
    const start = new Date(event.startAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    if (!event.endAt) return start;
    const end = new Date(event.endAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `${start} - ${end}`;
  };

  const renderEventCard = (item: EventItem) => {
    const label = isFrench ? item.titleFr : item.title;
    const showPoster = !!item.imageUrl && !failedImages[item.id];

    return (
      <Pressable
        key={item.id}
        onPress={() => setSelectedEvent(item)}
        style={[styles.eventCard, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}
      >
        {showPoster ? (
          <RNImage
            source={{ uri: item.imageUrl! }}
            style={styles.poster}
            resizeMode="cover"
            onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
          />
        ) : (
          <View style={[styles.posterFallback, { backgroundColor: isDark ? "#2a2237" : "#efe7f7" }]}>
            <FontAwesome name="calendar" size={22} color="#d40000" />
          </View>
        )}

        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: isDark ? "#fff" : "#1f1730" }]}>{label}</Text>
          <Text style={[styles.eventDate, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{item.dateLabel}</Text>
          <Text style={[styles.eventMetaLine, { color: isDark ? "#9e96b3" : "#6c6280" }]}>
            {item.location || "TBD"}
          </Text>
          <Pressable style={styles.registerButton} onPress={() => setSelectedEvent(item)}>
            <Text style={styles.registerText}>{text.open}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: isDark ? "#fff" : "#171321" }]}>{text.title}</Text>
        {isLoading ? <Text style={[styles.loadingText, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>Loading events...</Text> : null}

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#20172d" }]}>{text.current}</Text>
          {(upcomingFromDb.length ? upcomingFromDb : CURRENT_EVENTS).map(renderEventCard)}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#20172d" }]}>{text.past}</Text>
          {(pastFromDb.length ? pastFromDb : PAST_EVENTS).map(renderEventCard)}
        </View>
      </ScrollView>

      <Modal visible={!!selectedEvent} transparent animationType="fade" onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#171321" : "#fff" }]}>
            <View style={styles.modalTopRow}>
              <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#1f1730" }]}>
                {selectedEvent ? (isFrench ? selectedEvent.titleFr : selectedEvent.title) : ""}
              </Text>
              <Pressable onPress={() => setSelectedEvent(null)}>
                <Text style={styles.modalClose}>{text.close}</Text>
              </Pressable>
            </View>

            {selectedEvent?.imageUrl && !failedImages[selectedEvent.id] ? (
              <RNImage
                source={{ uri: selectedEvent.imageUrl }}
                style={styles.modalPoster}
                resizeMode="cover"
                onError={() =>
                  setFailedImages((prev) => (selectedEvent ? { ...prev, [selectedEvent.id]: true } : prev))
                }
              />
            ) : null}

            <Text style={[styles.modalLabel, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{text.when}</Text>
            <Text style={[styles.modalValue, { color: isDark ? "#fff" : "#1f1730" }]}>
              {selectedEvent ? formatRange(selectedEvent) : ""}
            </Text>

            <Text style={[styles.modalLabel, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{text.where}</Text>
            <Text style={[styles.modalValue, { color: isDark ? "#fff" : "#1f1730" }]}>
              {selectedEvent?.location || "TBD"}
            </Text>

            <Text style={[styles.modalLabel, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{text.type}</Text>
            <Text style={[styles.modalValue, { color: isDark ? "#fff" : "#1f1730" }]}>
              {selectedEvent?.isPast ? text.pastEvent : text.currentEvent}
            </Text>

            {selectedEvent?.registerUrl ? (
              <Pressable style={styles.modalButton} onPress={() => void openExternal(selectedEvent.registerUrl!)}>
                <Text style={styles.modalButtonText}>{text.register}</Text>
              </Pressable>
            ) : (
              <Text style={[styles.noLinkText, { color: isDark ? "#b8b0ca" : "#6c6280" }]}>{text.noLink}</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

async function resolveEventImageUrl(raw: unknown): Promise<string | undefined> {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  const cleanPath = value.replace(/^\/+/, "");
  const supabaseUrlMatch = cleanPath.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)/i);
  if (/^https?:\/\//i.test(value) && !supabaseUrlMatch) return value;

  for (const bucket of ["event-posters", "event_posters"]) {
    let pathInBucket = cleanPath;
    if (supabaseUrlMatch) {
      const parsedBucket = supabaseUrlMatch[1];
      let parsedPath = decodeURIComponent(supabaseUrlMatch[2]);
      if (parsedBucket !== bucket) {
        continue;
      }
      const dupPrefix = `${bucket}/`;
      if (parsedPath.startsWith(dupPrefix)) {
        parsedPath = parsedPath.slice(dupPrefix.length);
      }
      pathInBucket = parsedPath;
    } else {
      const bucketPrefixed = `${bucket}/`;
      pathInBucket = cleanPath.startsWith(bucketPrefixed)
        ? cleanPath.slice(bucketPrefixed.length)
        : cleanPath;
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(pathInBucket);
    if (publicData?.publicUrl) return publicData.publicUrl;

    const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(pathInBucket, 60 * 60 * 24 * 7);
    if (signedData?.signedUrl) return signedData.signedUrl;
  }
  return undefined;
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
  eventMetaLine: { marginTop: 2, fontSize: 12, fontWeight: "600" },
  registerButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#d40000",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  registerText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  loadingText: { marginTop: 8, marginBottom: 4, fontSize: 13, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    borderRadius: 14,
    padding: 14,
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  modalClose: { color: "#d40000", fontWeight: "700" },
  modalPoster: { width: "100%", height: 200, borderRadius: 10, marginTop: 10 },
  modalLabel: { marginTop: 10, fontSize: 12, fontWeight: "700" },
  modalValue: { marginTop: 3, fontSize: 15, fontWeight: "600" },
  modalButton: {
    marginTop: 14,
    backgroundColor: "#d40000",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalButtonText: { color: "#fff", fontWeight: "800" },
  noLinkText: { marginTop: 14, fontSize: 13 },
});
