import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type DbEvent = {
  id: string;
  title: string;
  title_fr: string | null;
  host_name: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  image_url: string | null;
  register_url: string | null;
  is_published: boolean;
};

type PickerTarget = "start" | "end" | "editStart" | "editEnd";

export default function AdminEventsScreen() {
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [hostName, setHostName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [registerUrl, setRegisterUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [eventsTableMissing, setEventsTableMissing] = useState(false);
  const [eventType, setEventType] = useState<"current" | "past">("current");
  const [localPosterUri, setLocalPosterUri] = useState<string | null>(null);
  const [localPosterMime, setLocalPosterMime] = useState<string | null>(null);
  const [localPosterName, setLocalPosterName] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTitleFr, setEditTitleFr] = useState("");
  const [editHostName, setEditHostName] = useState("");
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editRegisterUrl, setEditRegisterUrl] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [editLocalPosterUri, setEditLocalPosterUri] = useState<string | null>(null);
  const [editLocalPosterMime, setEditLocalPosterMime] = useState<string | null>(null);
  const [editLocalPosterName, setEditLocalPosterName] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState('');

  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const later = new Date();
    later.setHours(later.getHours() + 2, 0, 0, 0);
    return later;
  });
  const [editStartDate, setEditStartDate] = useState<Date>(() => new Date());
  const [editEndDate, setEditEndDate] = useState<Date>(() => new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [activePicker, setActivePicker] = useState<PickerTarget | null>(null);

  useEffect(() => {
    setStartAt(startDate.toISOString());
  }, [startDate]);

  useEffect(() => {
    setEndAt(endDate.toISOString());
  }, [endDate]);

  const formattedStart = useMemo(() => formatDisplayDate(startDate), [startDate]);
  const formattedEnd = useMemo(() => formatDisplayDate(endDate), [endDate]);
  const formattedEditStart = useMemo(() => formatDisplayDate(editStartDate), [editStartDate]);
  const formattedEditEnd = useMemo(() => formatDisplayDate(editEndDate), [editEndDate]);
  const currentEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      const ts = Date.parse(e.start_at);
      return Number.isFinite(ts) ? ts >= now : true;
    });
  }, [events]);
  const pastEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      const ts = Date.parse(e.start_at);
      return Number.isFinite(ts) ? ts < now : false;
    });
  }, [events]);

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
        setUserId(user.id);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role,is_admin")
          .eq("id", user.id)
          .single();
        const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
        const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
        const allowed =
          profile?.role === "admin" ||
          profile?.is_admin === true ||
          metadata.role === "admin" ||
          metadata.is_admin === true ||
          appMetadata.role === "admin" ||
          appMetadata.is_admin === true;

        if (profileError) {
          console.warn("Admin role check fallback to metadata:", profileError.message);
        }
        setIsAdmin(allowed);
        if (!allowed) {
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

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    let { data, error } = await supabase
      .from("events")
      .select("id,title,title_fr,host_name,start_at,end_at,location,image_url,register_url,is_published")
      .order("start_at", { ascending: false });
    if (error && error.message.toLowerCase().includes("host_name")) {
      const fallback = await supabase
        .from("events")
        .select("id,title,title_fr,start_at,end_at,location,image_url,register_url,is_published")
        .order("start_at", { ascending: false });
      data = (fallback.data as DbEvent[])?.map((item) => ({ ...item, host_name: null })) ?? null;
      error = fallback.error;
    }
    if (error) {
      if (error.message.includes("Could not find the table")) {
        setEventsTableMissing(true);
      } else {
        Alert.alert("Events load failed", error.message);
      }
      setIsLoadingEvents(false);
      return;
    }
    setEventsTableMissing(false);
    setEvents((data as DbEvent[]) ?? []);
    setIsLoadingEvents(false);
  };

  useEffect(() => {
    if (isAdmin) {
      void loadEvents();
    }
  }, [isAdmin]);

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setActivePicker(null);
      return;
    }
    if (!selectedDate || !activePicker) return;

    if (activePicker === "start") {
      setStartDate(selectedDate);
      if (selectedDate.getTime() >= endDate.getTime()) {
        const nextEnd = new Date(selectedDate.getTime() + 60 * 60 * 1000);
        setEndDate(nextEnd);
      }
    } else if (activePicker === "end") {
      setEndDate(selectedDate);
    } else if (activePicker === "editStart") {
      setEditStartDate(selectedDate);
      setEditStartAt(selectedDate.toISOString());
      if (selectedDate.getTime() >= editEndDate.getTime()) {
        const nextEnd = new Date(selectedDate.getTime() + 60 * 60 * 1000);
        setEditEndDate(nextEnd);
        setEditEndAt(nextEnd.toISOString());
      }
    } else if (activePicker === "editEnd") {
      setEditEndDate(selectedDate);
      setEditEndAt(selectedDate.toISOString());
    }

    if (Platform.OS !== "ios") {
      setActivePicker(null);
    }
  };

  const importFromTicketGateway = async () => {
    if (!registerUrl.includes("ticketgateway.com")) {
      Alert.alert("Invalid URL", "Paste a TicketGateway event URL first.");
      return;
    }

    const lastPart = registerUrl.split("/").filter(Boolean).pop() ?? "";
    const readable = prettifySlug(lastPart)
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .trim();
    if (!title.trim()) setTitle(readable || "New Event");
    if (!titleFr.trim()) setTitleFr(readable || "New Event");

    try {
      const res = await fetch(registerUrl);
      const html = await res.text();

      const parsedTitle = sanitizeImportedTitle(extractTicketGatewayTitle(html));
      if (parsedTitle) {
        setTitle(parsedTitle);
        if (!titleFr.trim()) setTitleFr(parsedTitle);
      }

      const parsedDate = extractTicketGatewayDateRange(html);
      if (parsedDate?.start) {
        const startDateObj = new Date(parsedDate.start);
        if (!Number.isNaN(startDateObj.getTime())) {
          setStartDate(startDateObj);
        }
      }
      if (parsedDate?.end) {
        const endDateObj = new Date(parsedDate.end);
        if (!Number.isNaN(endDateObj.getTime())) {
          setEndDate(endDateObj);
        }
      }

      const parsedLocation = extractTicketGatewayLocation(html);
      if (parsedLocation) setLocation(parsedLocation);

      Alert.alert(
        "Imported",
        "Title/date/location were imported when available. Please review before saving."
      );
    } catch {
      Alert.alert(
        "Imported from URL slug only",
        "Could not fetch TicketGateway page details. Title was filled from URL."
      );
    }
  };

  const pickPosterFromPhone = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to pick an event poster.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setLocalPosterUri(asset.uri);
      setLocalPosterMime(asset.mimeType ?? null);
      setLocalPosterName(asset.fileName ?? asset.uri.split("/").pop() ?? "Selected image");
    }
  };

  const pickEditPosterFromPhone = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to pick an event poster.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setEditLocalPosterUri(asset.uri);
      setEditLocalPosterMime(asset.mimeType ?? null);
      setEditLocalPosterName(asset.fileName ?? asset.uri.split("/").pop() ?? "Selected image");
    }
  };

  const uploadPoster = async (
    pickedUri: string | null,
    pickedMime: string | null,
    typedImageUrl: string
  ): Promise<string | null> => {
    if (!pickedUri) return typedImageUrl.trim() || null;
    try {
      const response = await fetch(pickedUri);
      const blob = await response.blob();
      const safeMime = pickedMime ?? blob.type ?? "image/jpeg";
      const extension = mimeToExtension(safeMime);
      const filePath = `poster-${Date.now()}.${extension}`;
      const candidateBuckets = ["event-posters", "event_posters"];
      let uploadedBucket: string | null = null;
      let uploadErrorMessage: string | null = null;

      for (const bucket of candidateBuckets) {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, { contentType: safeMime, upsert: false });

        if (!uploadError) {
          uploadedBucket = bucket;
          break;
        }

        uploadErrorMessage = uploadError.message;
        if (!uploadError.message.toLowerCase().includes("bucket")) {
          break;
        }
      }

      if (!uploadedBucket) {
        Alert.alert(
          "Poster upload failed",
          `${uploadErrorMessage ?? "Storage upload failed."}\n\nCreate a public storage bucket named event-posters, then retry. Using typed image URL if provided.`
        );
        return typedImageUrl.trim() || null;
      }
      return `${uploadedBucket}/${filePath}`;
    } catch {
      Alert.alert(
        "Poster upload failed",
        "Could not upload poster from phone storage. Using typed image URL if provided."
      );
      return typedImageUrl.trim() || null;
    }
  };

  const uploadPosterIfNeeded = async (): Promise<string | null> => {
    return uploadPoster(localPosterUri, localPosterMime, imageUrl);
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !hostName.trim()) {
      Alert.alert("Missing fields", "Title and host name are required.");
      return;
    }
    if (eventType === "current" && (!startAt.trim() || !endAt.trim() || !location.trim())) {
      Alert.alert("Missing fields", "For current/upcoming events, start date/time, end date/time, and location are required.");
      return;
    }
    if (!userId) return;

    const isPast = eventType === "past";
    const parsedStart = isPast
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      : parseDateInput(startAt);
    const parsedEnd = isPast
      ? new Date().toISOString()
      : parseDateInput(endAt);

    if (!parsedStart) {
      Alert.alert("Invalid start date", "Please select a valid start date/time.");
      return;
    }
    if (!parsedEnd) {
      Alert.alert("Invalid end date", "Please select a valid end date/time.");
      return;
    }
    if (new Date(parsedEnd).getTime() <= new Date(parsedStart).getTime()) {
      Alert.alert("Invalid range", "End date/time must be after the start date/time.");
      return;
    }

    const finalImageUrl = await uploadPosterIfNeeded();

    setIsSaving(true);
    const payload = {
      title: title.trim(),
      title_fr: titleFr.trim() || null,
      host_name: hostName.trim() || null,
      start_at: parsedStart,
      end_at: parsedEnd,
      location: isPast ? (location.trim() || null) : location.trim(),
      image_url: finalImageUrl,
      register_url: isPast ? null : registerUrl.trim() || null,
      is_published: published,
      created_by: userId,
    };

    let { error } = await supabase.from("events").insert(payload);
    if (error && error.message.toLowerCase().includes("host_name")) {
      const { host_name, ...legacyPayload } = payload;
      const retry = await supabase.from("events").insert(legacyPayload);
      error = retry.error;
    }
    if (error) {
      if (error.message.includes("Could not find the table")) {
        setEventsTableMissing(true);
        Alert.alert(
          "Events table missing",
          "Create public.events in Supabase first, then retry."
        );
      } else {
        Alert.alert("Create event failed", error.message);
      }
      setIsSaving(false);
      return;
    }

    const now = new Date();
    now.setMinutes(0, 0, 0);
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    setTitle("");
    setTitleFr("");
    setHostName("");
    setStartDate(now);
    setEndDate(later);
    setLocation("");
    setImageUrl("");
    setLocalPosterUri(null);
    setLocalPosterMime(null);
    setLocalPosterName(null);
    setRegisterUrl("");
    setPublished(true);
    setEventType("current");

    await loadEvents();
    setLastActionMessage("Event created successfully.");
    Alert.alert("Success", "Event created successfully.");
    setIsSaving(false);
  };

  const startEditEvent = (event: DbEvent) => {
    setEditingEventId(event.id);
    setEditTitle(event.title ?? "");
    setEditTitleFr(event.title_fr ?? "");
    setEditHostName(event.host_name ?? "");
    setEditStartAt(event.start_at ?? "");
    setEditEndAt(event.end_at ?? "");
    setEditLocation(event.location ?? "");
    setEditImageUrl(event.image_url ?? "");
    setEditRegisterUrl(event.register_url ?? "");
    setEditPublished(event.is_published);
    setEditLocalPosterUri(null);
    setEditLocalPosterMime(null);
    setEditLocalPosterName(null);
    const parsedStart = event.start_at ? new Date(event.start_at) : new Date();
    const parsedEnd = event.end_at ? new Date(event.end_at) : new Date(parsedStart.getTime() + 2 * 60 * 60 * 1000);
    setEditStartDate(Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart);
    setEditEndDate(Number.isNaN(parsedEnd.getTime()) ? new Date(Date.now() + 2 * 60 * 60 * 1000) : parsedEnd);
  };

  const openDatePicker = (target: PickerTarget) => {
    const applyPickedDate = (picked: Date) => {
      if (target === "start") {
        setStartDate(picked);
        if (picked.getTime() >= endDate.getTime()) {
          setEndDate(new Date(picked.getTime() + 60 * 60 * 1000));
        }
      } else if (target === "end") {
        setEndDate(picked);
      } else if (target === "editStart") {
        setEditStartDate(picked);
        setEditStartAt(picked.toISOString());
        if (picked.getTime() >= editEndDate.getTime()) {
          const next = new Date(picked.getTime() + 60 * 60 * 1000);
          setEditEndDate(next);
          setEditEndAt(next.toISOString());
        }
      } else if (target === "editEnd") {
        setEditEndDate(picked);
        setEditEndAt(picked.toISOString());
      }
    };

    if (Platform.OS !== "android") {
      setActivePicker(target);
      return;
    }

    const value =
      target === "start"
        ? startDate
        : target === "end"
          ? endDate
          : target === "editStart"
            ? editStartDate
            : editEndDate;

    DateTimePickerAndroid.open({
      value,
      mode: "date",
      is24Hour: false,
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed" || !selectedDate) return;
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "time",
          is24Hour: false,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type === "dismissed" || !selectedTime) return;
            const combined = new Date(selectedDate);
            combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            applyPickedDate(combined);
          },
        });
      },
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    setEditTitle("");
    setEditTitleFr("");
    setEditHostName("");
    setEditStartAt("");
    setEditEndAt("");
    setEditLocation("");
    setEditImageUrl("");
    setEditRegisterUrl("");
    setEditPublished(true);
    setEditLocalPosterUri(null);
    setEditLocalPosterMime(null);
    setEditLocalPosterName(null);
  };

  const handleUpdateEvent = async () => {
    if (!editingEventId) return;
    if (!editTitle.trim() || !editHostName.trim() || !editStartAt.trim() || !editEndAt.trim() || !editLocation.trim()) {
      Alert.alert("Missing fields", "Title, host name, start date/time, end date/time, and location are required.");
      return;
    }

    const parsedStart = parseDateInput(editStartAt);
    const parsedEnd = parseDateInput(editEndAt);
    if (!parsedStart || !parsedEnd) {
      Alert.alert("Invalid date", "Start/end date format is invalid.");
      return;
    }
    if (new Date(parsedEnd).getTime() <= new Date(parsedStart).getTime()) {
      Alert.alert("Invalid range", "End date/time must be after start date/time.");
      return;
    }

    setIsUpdating(true);
    const finalImageUrl = await uploadPoster(editLocalPosterUri, editLocalPosterMime, editImageUrl);
    const payload = {
      title: editTitle.trim(),
      title_fr: editTitleFr.trim() || null,
      host_name: editHostName.trim() || null,
      start_at: parsedStart,
      end_at: parsedEnd,
      location: editLocation.trim(),
      image_url: finalImageUrl,
      register_url: editRegisterUrl.trim() || null,
      is_published: editPublished,
    };

    let { error } = await supabase.from("events").update(payload).eq("id", editingEventId);
    if (error && error.message.toLowerCase().includes("host_name")) {
      const { host_name, ...legacyPayload } = payload;
      const retry = await supabase.from("events").update(legacyPayload).eq("id", editingEventId);
      error = retry.error;
    }
    if (error) {
      Alert.alert("Update failed", error.message);
      setIsUpdating(false);
      return;
    }

    await loadEvents();
    setIsUpdating(false);
    setLastActionMessage("Event updated successfully.");
    Alert.alert("Success", "Event updated successfully.");
    cancelEditEvent();
  };

  const togglePublished = async (eventId: string, next: boolean) => {
    const { error } = await supabase.from("events").update({ is_published: next }).eq("id", eventId);
    if (error) {
      Alert.alert("Update failed", error.message);
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, is_published: next } : e)));
  };

  if (isCheckingAdmin) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#d40000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Admin Event Manager</Text>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/admin-dashboard");
              }
            }}
          >
            <Text style={styles.back}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.help}>
          Add current or past events. You can paste a TicketGateway URL, import basic info, and add poster from phone or URL.
        </Text>

        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeChip, eventType === "current" && styles.typeChipActive]}
            onPress={() => setEventType("current")}
          >
            <Text style={[styles.typeChipText, eventType === "current" && styles.typeChipTextActive]}>
              Add Current Event
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeChip, eventType === "past" && styles.typeChipActive]}
            onPress={() => setEventType("past")}
          >
            <Text style={[styles.typeChipText, eventType === "past" && styles.typeChipTextActive]}>
              Add Past Event
            </Text>
          </Pressable>
        </View>

        {eventType === "current" ? (
          <>
            <TextInput style={styles.input} value={registerUrl} onChangeText={setRegisterUrl} placeholder="Ticket/registration URL" placeholderTextColor="#8a8198" />
            <Pressable style={styles.outlineBtn} onPress={importFromTicketGateway}>
              <Text style={styles.outlineBtnText}>Import From TicketGateway URL</Text>
            </Pressable>
          </>
        ) : null}

        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title (EN)" placeholderTextColor="#8a8198" />
        {eventType === "current" ? (
          <TextInput style={styles.input} value={titleFr} onChangeText={setTitleFr} placeholder="Title (FR optional)" placeholderTextColor="#8a8198" />
        ) : null}
        <TextInput style={styles.input} value={hostName} onChangeText={setHostName} placeholder="Host name (required)" placeholderTextColor="#8a8198" />

        {eventType === "current" ? (
          <>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>Start Date & Time (Required)</Text>
              <Pressable style={styles.dateBtn} onPress={() => openDatePicker("start")}>
                <Text style={styles.dateBtnText}>{formattedStart}</Text>
              </Pressable>
            </View>

            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>End Date & Time (Required)</Text>
              <Pressable style={styles.dateBtn} onPress={() => openDatePicker("end")}>
                <Text style={styles.dateBtnText}>{formattedEnd}</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {activePicker ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={
                activePicker === "start"
                  ? startDate
                  : activePicker === "end"
                    ? endDate
                    : activePicker === "editStart"
                      ? editStartDate
                      : editEndDate
              }
              mode="datetime"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handlePickerChange}
            />
            {Platform.OS === "ios" ? (
              <Pressable style={styles.outlineBtn} onPress={() => setActivePicker(null)}>
                <Text style={styles.outlineBtnText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {eventType === "current" ? (
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location (required)" placeholderTextColor="#8a8198" />
        ) : null}
        <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="Poster image URL (optional)" placeholderTextColor="#8a8198" />
        <Pressable style={styles.outlineBtn} onPress={pickPosterFromPhone}>
          <Text style={styles.outlineBtnText}>
            {localPosterUri ? "Poster selected from phone" : "Choose Poster from Phone"}
          </Text>
        </Pressable>
        {localPosterName ? <Text style={styles.posterName}>Selected: {localPosterName}</Text> : null}

        <Pressable style={styles.publishRow} onPress={() => setPublished((p) => !p)}>
          <FontAwesome name={published ? "check-square-o" : "square-o"} size={18} color="#d40000" />
          <Text style={styles.publishText}>Publish immediately</Text>
        </Pressable>

        <Pressable style={styles.primaryBtn} onPress={handleCreateEvent} disabled={isSaving}>
          <Text style={styles.primaryBtnText}>{isSaving ? "Saving..." : "Create Event"}</Text>
        </Pressable>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Existing Events</Text>
          <Pressable onPress={() => void loadEvents()}>
            <Text style={styles.refresh}>Refresh</Text>
          </Pressable>
        </View>
        {lastActionMessage ? <Text style={styles.successText}>{lastActionMessage}</Text> : null}

        {eventsTableMissing ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Supabase setup needed</Text>
            <Text style={styles.warningText}>
              Table `public.events` was not found. Create it in Supabase SQL Editor, then tap Refresh.
            </Text>
          </View>
        ) : null}

        {isLoadingEvents ? <ActivityIndicator color="#d40000" /> : null}

        <Text style={styles.subsectionTitle}>Current Events</Text>
        {currentEvents.map((item) => (
          <View key={item.id} style={styles.eventCard}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.eventThumb} contentFit="cover" cachePolicy="none" />
            ) : null}
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventMeta}>Host: {item.host_name ?? "N/A"}</Text>
            <Text style={styles.eventMeta}>{item.start_at}</Text>
            <Text style={styles.eventMeta}>{item.location ?? "No location"}</Text>
            <Text style={styles.eventMeta}>{item.register_url ?? "No link"}</Text>
            <View style={styles.cardActionsRow}>
              <Pressable style={styles.outlineBtn} onPress={() => void togglePublished(item.id, !item.is_published)}>
                <Text style={styles.outlineBtnText}>
                  {item.is_published ? "Mark Unpublished" : "Publish"}
                </Text>
              </Pressable>
              <Pressable style={styles.editBtn} onPress={() => startEditEvent(item)}>
                <Text style={styles.editBtnText}>Edit Event</Text>
              </Pressable>
            </View>

            {editingEventId === item.id ? (
              <View style={styles.editPanel}>
                <Text style={styles.editTitle}>Edit Event</Text>
                <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Title (EN)" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editTitleFr} onChangeText={setEditTitleFr} placeholder="Title (FR optional)" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editHostName} onChangeText={setEditHostName} placeholder="Host name (required)" placeholderTextColor="#8a8198" />
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Start Date & Time (Required)</Text>
                  <Pressable style={styles.dateBtn} onPress={() => openDatePicker("editStart")}>
                    <Text style={styles.dateBtnText}>{formattedEditStart}</Text>
                  </Pressable>
                </View>
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>End Date & Time (Required)</Text>
                  <Pressable style={styles.dateBtn} onPress={() => openDatePicker("editEnd")}>
                    <Text style={styles.dateBtnText}>{formattedEditEnd}</Text>
                  </Pressable>
                </View>
                <TextInput style={styles.input} value={editLocation} onChangeText={setEditLocation} placeholder="Location" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editRegisterUrl} onChangeText={setEditRegisterUrl} placeholder="Ticket/registration URL" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editImageUrl} onChangeText={setEditImageUrl} placeholder="Poster image URL (optional)" placeholderTextColor="#8a8198" />
                <Pressable style={styles.outlineBtn} onPress={pickEditPosterFromPhone}>
                  <Text style={styles.outlineBtnText}>
                    {editLocalPosterUri ? "New poster selected from phone" : "Choose New Poster from Phone"}
                  </Text>
                </Pressable>
                {editLocalPosterName ? <Text style={styles.posterName}>Selected: {editLocalPosterName}</Text> : null}
                <Pressable style={styles.publishRow} onPress={() => setEditPublished((p) => !p)}>
                  <FontAwesome name={editPublished ? "check-square-o" : "square-o"} size={18} color="#d40000" />
                  <Text style={styles.publishText}>Published</Text>
                </Pressable>
                <View style={styles.cardActionsRow}>
                  <Pressable style={styles.primaryBtnSmall} onPress={handleUpdateEvent} disabled={isUpdating}>
                    <Text style={styles.primaryBtnText}>{isUpdating ? "Saving..." : "Save Changes"}</Text>
                  </Pressable>
                  <Pressable style={styles.outlineBtn} onPress={cancelEditEvent}>
                    <Text style={styles.outlineBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ))}

        {!currentEvents.length && !isLoadingEvents ? (
          <Text style={styles.emptyText}>No current events yet.</Text>
        ) : null}

        <Text style={styles.subsectionTitle}>Past Events</Text>
        {pastEvents.map((item) => (
          <View key={item.id} style={styles.eventCard}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.eventThumb} contentFit="cover" cachePolicy="none" />
            ) : null}
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventMeta}>Host: {item.host_name ?? "N/A"}</Text>
            <Text style={styles.eventMeta}>{item.start_at}</Text>
            <Text style={styles.eventMeta}>{item.location ?? "No location"}</Text>
            <Text style={styles.eventMeta}>{item.register_url ?? "No link"}</Text>
            <View style={styles.cardActionsRow}>
              <Pressable style={styles.outlineBtn} onPress={() => void togglePublished(item.id, !item.is_published)}>
                <Text style={styles.outlineBtnText}>
                  {item.is_published ? "Mark Unpublished" : "Publish"}
                </Text>
              </Pressable>
              <Pressable style={styles.editBtn} onPress={() => startEditEvent(item)}>
                <Text style={styles.editBtnText}>Edit Event</Text>
              </Pressable>
            </View>

            {editingEventId === item.id ? (
              <View style={styles.editPanel}>
                <Text style={styles.editTitle}>Edit Event</Text>
                <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Title (EN)" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editTitleFr} onChangeText={setEditTitleFr} placeholder="Title (FR optional)" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editHostName} onChangeText={setEditHostName} placeholder="Host name (required)" placeholderTextColor="#8a8198" />
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>Start Date & Time (Required)</Text>
                  <Pressable style={styles.dateBtn} onPress={() => openDatePicker("editStart")}>
                    <Text style={styles.dateBtnText}>{formattedEditStart}</Text>
                  </Pressable>
                </View>
                <View style={styles.dateCard}>
                  <Text style={styles.dateLabel}>End Date & Time (Required)</Text>
                  <Pressable style={styles.dateBtn} onPress={() => openDatePicker("editEnd")}>
                    <Text style={styles.dateBtnText}>{formattedEditEnd}</Text>
                  </Pressable>
                </View>
                <TextInput style={styles.input} value={editLocation} onChangeText={setEditLocation} placeholder="Location" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editRegisterUrl} onChangeText={setEditRegisterUrl} placeholder="Ticket/registration URL" placeholderTextColor="#8a8198" />
                <TextInput style={styles.input} value={editImageUrl} onChangeText={setEditImageUrl} placeholder="Poster image URL (optional)" placeholderTextColor="#8a8198" />
                <Pressable style={styles.outlineBtn} onPress={pickEditPosterFromPhone}>
                  <Text style={styles.outlineBtnText}>
                    {editLocalPosterUri ? "New poster selected from phone" : "Choose New Poster from Phone"}
                  </Text>
                </Pressable>
                {editLocalPosterName ? <Text style={styles.posterName}>Selected: {editLocalPosterName}</Text> : null}
                <Pressable style={styles.publishRow} onPress={() => setEditPublished((p) => !p)}>
                  <FontAwesome name={editPublished ? "check-square-o" : "square-o"} size={18} color="#d40000" />
                  <Text style={styles.publishText}>Published</Text>
                </Pressable>
                <View style={styles.cardActionsRow}>
                  <Pressable style={styles.primaryBtnSmall} onPress={handleUpdateEvent} disabled={isUpdating}>
                    <Text style={styles.primaryBtnText}>{isUpdating ? "Saving..." : "Save Changes"}</Text>
                  </Pressable>
                  <Pressable style={styles.outlineBtn} onPress={cancelEditEvent}>
                    <Text style={styles.outlineBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ))}

        {!pastEvents.length && !isLoadingEvents ? (
          <Text style={styles.emptyText}>No past events yet.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function parseDateInput(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDisplayDate(value: Date): string {
  return value.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}


function mimeToExtension(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("heic") || normalized.includes("heif")) return "heic";
  return "jpg";
}
function prettifySlug(slug: string): string {
  return slug
    .replace(/---/g, " ")
    .replace(/--/g, " & ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getJsonLdObjects(html: string): Record<string, unknown>[] {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const results: Record<string, unknown>[] = [];

  for (const scriptMatch of scripts) {
    const raw = scriptMatch[1]?.trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === "object") results.push(item as Record<string, unknown>);
        });
      } else if (parsed && typeof parsed === "object") {
        results.push(parsed as Record<string, unknown>);
      }
    } catch {
      continue;
    }
  }

  return results;
}

function extractTicketGatewayTitle(html: string): string | null {
  const jsonLd = getJsonLdObjects(html);
  for (const item of jsonLd) {
    const type = String(item["@type"] ?? "").toLowerCase();
    if (type.includes("event")) {
      const name = item.name;
      if (typeof name === "string" && name.trim()) return decodeHtmlEntities(name.trim());
    }
  }

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) return decodeHtmlEntities(ogTitle).trim();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch?.[1]) return null;

  return decodeHtmlEntities(titleMatch[1])
    .replace(/\s*\|\s*TicketGateway.*$/i, "")
    .trim();
}

function extractTicketGatewayDateRange(html: string): { start: string; end: string | null } | null {
  const jsonLd = getJsonLdObjects(html);
  for (const item of jsonLd) {
    const type = String(item["@type"] ?? "").toLowerCase();
    if (!type.includes("event")) continue;

    const startDate = typeof item.startDate === "string" ? new Date(item.startDate) : null;
    const endDate = typeof item.endDate === "string" ? new Date(item.endDate) : null;

    if (startDate && !Number.isNaN(startDate.getTime())) {
      const start = startDate.toISOString();
      const end = endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : null;
      return { start, end };
    }
  }

  const text = extractVisibleText(html);
  const dateRegex =
    /([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s*[AP]M)/i;
  const match = text.match(dateRegex);
  if (!match) return null;

  const start = toIsoFromTextDate(match[1]);
  const end = toIsoFromTextDate(match[2]);

  if (!start) return null;
  return { start, end };
}

function toIsoFromTextDate(text: string): string | null {
  const d = new Date(text.replace(/\s+/g, " ").trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function extractTicketGatewayLocation(html: string): string | null {
  const jsonLd = getJsonLdObjects(html);
  for (const item of jsonLd) {
    const type = String(item["@type"] ?? "").toLowerCase();
    if (!type.includes("event")) continue;

    const loc = (item.location ?? null) as Record<string, unknown> | null;
    if (!loc || typeof loc !== "object") continue;

    const name = typeof loc.name === "string" ? loc.name.trim() : "";
    const address = (loc.address ?? null) as Record<string, unknown> | null;
    const addrParts = [
      typeof address?.streetAddress === "string" ? address.streetAddress : "",
      typeof address?.addressLocality === "string" ? address.addressLocality : "",
      typeof address?.addressRegion === "string" ? address.addressRegion : "",
      typeof address?.addressCountry === "string" ? address.addressCountry : "",
    ].filter(Boolean);

    const combined = [name, addrParts.join(", ")].filter(Boolean).join(" - ").trim();
    if (combined && !combined.toLowerCase().includes("var ")) {
      return combined;
    }
  }

  const text = extractVisibleText(html);
  const fallback = text.match(/Location\s+([A-Za-z0-9,\-\s]{8,160})/i);
  if (!fallback?.[1]) return null;

  const candidate = fallback[1].replace(/\s+/g, " ").trim();
  if (!candidate || candidate.toLowerCase().includes("http") || candidate.toLowerCase().includes("var ")) {
    return null;
  }
  return candidate;
}

function sanitizeImportedTitle(raw: string | null): string | null {
  if (!raw) return null;

  let title = raw.replace(/\s+/g, " ").trim();
  title = title.replace(/\s*\|\s*TicketGateway.*$/i, "").trim();
  title = title.replace(/\s*-\s*TicketGateway.*$/i, "").trim();

  const ageTagged = title.match(/^(.+?\(\d+\+\))/);
  if (ageTagged?.[1]) {
    return ageTagged[1].trim();
  }

  title = title.replace(/\b(Mississauga|Toronto|Brampton)\b.*$/i, "").trim();
  title = title.replace(/\b(dff inc|dff\.inc)\s*$/i, "").trim();

  return title || null;
}

function extractVisibleText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  ).trim();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0c15" },
  center: { flex: 1, backgroundColor: "#0f0c15", justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 30 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  back: { color: "#d40000", fontWeight: "700" },
  help: { color: "#c3bdd3", marginTop: 8, marginBottom: 10 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: "#56456f",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipActive: {
    backgroundColor: "#d40000",
    borderColor: "#d40000",
  },
  typeChipText: { color: "#ddd1ef", fontWeight: "700", fontSize: 12 },
  typeChipTextActive: { color: "#fff" },
  input: {
    marginTop: 8,
    backgroundColor: "#1b1627",
    borderWidth: 1,
    borderColor: "#2e2740",
    borderRadius: 10,
    color: "#fff",
    padding: 12,
  },
  dateCard: {
    marginTop: 10,
    backgroundColor: "#1b1627",
    borderWidth: 1,
    borderColor: "#2e2740",
    borderRadius: 10,
    padding: 10,
  },
  dateLabel: { color: "#cfc8dd", fontWeight: "700", marginBottom: 8 },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#56456f",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dateBtnText: { color: "#fff", fontWeight: "700" },
  pickerWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2e2740",
    borderRadius: 10,
    backgroundColor: "#120f1b",
    padding: 8,
  },
  publishRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  publishText: { color: "#dfd9ee" },
  primaryBtn: { marginTop: 14, backgroundColor: "#d40000", borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  outlineBtn: { marginTop: 8, borderWidth: 1, borderColor: "#56456f", borderRadius: 10, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 8 },
  outlineBtnText: { color: "#ddd1ef", fontWeight: "700" },
  posterName: { color: "#c3bdd3", marginTop: 6, fontSize: 12 },
  cardActionsRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  editBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d40000",
    backgroundColor: "#2a0d15",
    borderRadius: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editBtnText: { color: "#ffd6de", fontWeight: "800" },
  subsectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 14, marginBottom: 4 },
  emptyText: { color: "#a79fba", marginTop: 8, marginBottom: 4 },
  editPanel: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2e2740",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#131020",
  },
  editTitle: { color: "#fff", fontWeight: "800", marginBottom: 4 },
  primaryBtnSmall: {
    marginTop: 8,
    backgroundColor: "#d40000",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  listHeader: { marginTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  refresh: { color: "#d40000", fontWeight: "700" },
  warningCard: {
    marginTop: 10,
    backgroundColor: "#2c1020",
    borderWidth: 1,
    borderColor: "#5e243f",
    borderRadius: 10,
    padding: 10,
  },
  warningTitle: { color: "#ffd7e5", fontWeight: "800" },
  warningText: { color: "#f7bfd3", marginTop: 4, lineHeight: 20 },
  eventCard: { marginTop: 10, backgroundColor: "#171321", borderWidth: 1, borderColor: "#2e2740", borderRadius: 12, padding: 10 },
  eventThumb: { width: "100%", height: 160, borderRadius: 8, marginBottom: 8, backgroundColor: "#0d0a14" },
  eventTitle: { color: "#fff", fontWeight: "800" },
  eventMeta: { color: "#beb8cf", marginTop: 4, fontSize: 12 },
  successText: { color: "#8ef0b5", marginTop: 8, fontWeight: "700" },
});





