import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const WORKOUT_TYPES = [
  "Cardio", "Leg Day", "Chest", "Back", "Shoulders",
  "Biceps", "Triceps", "Traps", "Forearms", "Abs",
  "Full Body", "HIIT", "Yoga", "Powerlifting",
  "Pilates", "Martial Arts", "Spotting Partner",
];

const WORKOUT_GOALS = [
  "Casual Workout", "Serious Training", "Weight Loss",
  "Muscle Gain", "Endurance", "Flexibility",
];

const LOOKING_FOR_OPTIONS = [
  "Gym Partner", "Accountability Buddy", "Friendly Competition",
  "Group Sessions", "Online Check-ins",
];

const GENDER_PREFERENCE_OPTIONS = [
  "No Preference", "Men Only", "Women Only", "Non-binary Friendly",
];

const SCHEDULE_OPTIONS = [
  "Early Morning (5–8am)", "Morning (8–11am)", "Midday (11am–1pm)",
  "Afternoon (1–5pm)", "Evening (5–8pm)", "Night (8pm+)",
  "Weekends Only", "Weekdays Only", "Flexible",
];

type WorkoutProfile = {
  id: string;
  first_name: string | null;
  city: string | null;
  age: number | null;
  workout_goal: string | null;
  workout_type: string[] | null;
  gender_preference: string | null;
  looking_for: string | null;
  is_visible: boolean | null;
  profile_photo_url: string | null;
  show_photo: boolean | null;
  schedule: string[] | null;
};

type MyProfile = {
  first_name: string;
  city: string;
  postal_code: string;
  age: string;
  workout_goal: string;
  workout_type: string[];
  gender_preference: string;
  looking_for: string;
  is_visible: boolean;
  profile_photo_url: string;
  show_photo: boolean;
  schedule: string[];
};

type Match = {
  id: string;
  other_user_id: string;
  other_first_name: string | null;
  other_photo_url: string | null;
  other_show_photo: boolean | null;
};

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function WorkoutPartnerTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile>({
    first_name: "",
    city: "",
    postal_code: "",
    age: "",
    workout_goal: "",
    workout_type: [],
    gender_preference: "No Preference",
    looking_for: "",
    is_visible: true,
    profile_photo_url: "",
    show_photo: true,
    schedule: [],
  });
  const [partners, setPartners] = useState<WorkoutProfile[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterMinAge, setFilterMinAge] = useState("");
  const [filterMaxAge, setFilterMaxAge] = useState("");
  const [filterGoal, setFilterGoal] = useState("");
  const [filterWorkoutType, setFilterWorkoutType] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [swipeAnim] = useState(new Animated.ValueXY());
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const messageSubscription = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const t = {
    title: isFrench ? "Partenaire" : "Workout Partner",
    sub: isFrench ? "Trouvez votre partenaire ideal." : "Find your ideal workout partner.",
    setupProfile: isFrench ? "Configurer profil" : "Set Up Profile",
    saveProfile: isFrench ? "Enregistrer" : "Save Profile",
    filters: isFrench ? "Filtres" : "Filters",
    applyFilters: isFrench ? "Appliquer" : "Apply",
    clearFilters: isFrench ? "Effacer" : "Clear",
    noMore: isFrench ? "Plus de profils pour l'instant." : "No more profiles for now.",
    nearby: isFrench ? "Partenaires disponibles" : "Available Partners",
    interested: isFrench ? "Interesse" : "Interested",
    pass: isFrench ? "Passer" : "Pass",
    city: isFrench ? "Ville" : "City",
    postalCode: isFrench ? "Code postal" : "Postal Code",
    age: isFrench ? "Age" : "Age",
    minAge: isFrench ? "Age min" : "Min Age",
    maxAge: isFrench ? "Age max" : "Max Age",
    workoutGoal: isFrench ? "Objectif" : "Workout Goal",
    workoutType: isFrench ? "Type" : "Workout Type",
    genderPref: isFrench ? "Preference" : "Gender Preference",
    lookingFor: isFrench ? "Je cherche" : "Looking For",
    schedule: isFrench ? "Horaire" : "Schedule",
    visible: isFrench ? "Visible pour les autres" : "Visible to others",
    showPhoto: isFrench ? "Afficher ma photo" : "Show my photo",
    myWorkoutTypes: isFrench ? "Mes types" : "My Workout Types",
    editProfile: isFrench ? "Modifier" : "Edit Profile",
    cancelEdit: isFrench ? "Annuler" : "Cancel",
    uploadPhoto: isFrench ? "Choisir une photo" : "Choose Photo",
    removePhoto: isFrench ? "Retirer la photo" : "Remove Photo",
    messages: isFrench ? "Messages" : "Messages",
    noMatches: isFrench ? "Pas encore de correspondances." : "No matches yet. Start swiping!",
    typeMessage: isFrench ? "Ecrire un message..." : "Type a message...",
    send: isFrench ? "Envoyer" : "Send",
    back: isFrench ? "Retour" : "Back",
  };

  const bg = isDark ? "#0f0c15" : "#f7f4fb";
  const cardBg = isDark ? "#171321" : "#ffffff";
  const cardBorder = isDark ? "#2a2338" : "#ebe2f3";
  const textColor = isDark ? "#ffffff" : "#1f1730";
  const subColor = isDark ? "#b8b0ca" : "#6c6280";
  const inputBg = isDark ? "#241d31" : "#f2edf9";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) { setIsLoading(false); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name,city,postal_code,age,workout_goal,workout_type,gender_preference,looking_for,is_visible,profile_photo_url,show_photo,schedule")
      .eq("id", user.id)
      .single();

    if (profile) {
      setMyProfile({
        first_name: profile.first_name ?? "",
        city: profile.city ?? "",
        postal_code: profile.postal_code ?? "",
        age: profile.age ? String(profile.age) : "",
        workout_goal: profile.workout_goal ?? "",
        workout_type: Array.isArray(profile.workout_type) ? profile.workout_type : [],
        gender_preference: profile.gender_preference ?? "No Preference",
        looking_for: profile.looking_for ?? "",
        is_visible: profile.is_visible !== false,
        profile_photo_url: profile.profile_photo_url ?? "",
        show_photo: profile.show_photo !== false,
        schedule: Array.isArray(profile.schedule) ? profile.schedule : [],
      });
    }

    await fetchPartners(user.id);
    await loadMatches(user.id);
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadData(); }, [loadData]));

  const loadMatches = async (uid: string) => {
    const { data, error } = await supabase
      .from("workout_matches")
      .select("id, user1_id, user2_id")
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`);

    if (error || !data) return;

    const enriched: Match[] = await Promise.all(
      data.map(async (match) => {
        const otherId = match.user1_id === uid ? match.user2_id : match.user1_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, profile_photo_url, show_photo")
          .eq("id", otherId)
          .single();
        return {
          id: match.id,
          other_user_id: otherId,
          other_first_name: profile?.first_name ?? null,
          other_photo_url: profile?.profile_photo_url ?? null,
          other_show_photo: profile?.show_photo ?? null,
        };
      })
    );
    setMatches(enriched);
  };

  const fetchPartners = async (
    uid: string,
    filters?: {
      city?: string; minAge?: string; maxAge?: string;
      goal?: string; workoutType?: string; gender?: string;
    }
  ) => {
    let query = supabase
      .from("profiles")
      .select("id,first_name,city,age,workout_goal,workout_type,gender_preference,looking_for,is_visible,profile_photo_url,show_photo,schedule")
      .eq("is_visible", true)
      .neq("id", uid);

    if (filters?.city?.trim()) query = query.ilike("city", `%${filters.city.trim()}%`);
    if (filters?.minAge?.trim()) query = query.gte("age", parseInt(filters.minAge));
    if (filters?.maxAge?.trim()) query = query.lte("age", parseInt(filters.maxAge));
    if (filters?.goal?.trim()) query = query.eq("workout_goal", filters.goal.trim());
    if (filters?.workoutType?.trim()) query = query.contains("workout_type", [filters.workoutType.trim()]);
    if (filters?.gender?.trim() && filters.gender !== "No Preference") {
      query = query.eq("gender_preference", filters.gender.trim());
    }

    const { data, error } = await query.limit(20);
    if (error) { console.warn("Partners load error:", error.message); return; }
    setPartners((data as WorkoutProfile[]) ?? []);
    setCardIndex(0);
  };

  const openConversation = async (match: Match) => {
    setActiveMatch(match);
    setShowConversation(true);
    await loadMessages(match.id);
    subscribeToMessages(match.id);
  };

  const loadMessages = async (matchId: string) => {
    const { data, error } = await supabase
      .from("workout_messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    if (error) { console.warn("Messages load error:", error.message); return; }
    setMessages((data as Message[]) ?? []);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const subscribeToMessages = (matchId: string) => {
    if (messageSubscription.current) {
      void supabase.removeChannel(messageSubscription.current);
    }
    messageSubscription.current = supabase
      .channel(`messages:${matchId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "workout_messages",
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeMatch || !userId) return;
    setIsSendingMessage(true);
    const { error } = await supabase.from("workout_messages").insert({
      match_id: activeMatch.id,
      sender_id: userId,
      content: newMessage.trim(),
    });
    if (error) { Alert.alert("Send failed", error.message); }
    else { setNewMessage(""); }
    setIsSendingMessage(false);
  };

  const closeConversation = () => {
    setShowConversation(false);
    setActiveMatch(null);
    setMessages([]);
    if (messageSubscription.current) {
      void supabase.removeChannel(messageSubscription.current);
      messageSubscription.current = null;
    }
  };

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    setIsUploadingPhoto(true);
    try {
      const mime = asset.mimeType ?? "image/jpeg";
      const ext = mime.includes("png") ? "png" : "jpg";
      const filePath = `${userId}-${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: filePath, type: mime } as unknown as Blob);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { Alert.alert("Upload failed", "Not authenticated."); return; }
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/profile-photos/${filePath}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "x-upsert": "true" },
        body: formData,
      });
      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        Alert.alert("Upload failed", errText);
        return;
      }
      const { data: publicData } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        const newUrl = publicData.publicUrl;
        setMyProfile((p) => ({ ...p, profile_photo_url: newUrl }));
        if (userId) {
          await supabase.from("profiles").update({ profile_photo_url: newUrl }).eq("id", userId);
        }
      }
    } catch (err) {
      Alert.alert("Upload failed", "Could not upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);

    // Add schedule column if it doesn't exist yet
    const updatePayload: Record<string, unknown> = {
      city: myProfile.city.trim() || null,
      postal_code: myProfile.postal_code.trim() || null,
      age: myProfile.age ? parseInt(myProfile.age) : null,
      workout_goal: myProfile.workout_goal || null,
      workout_type: myProfile.workout_type.length ? myProfile.workout_type : null,
      gender_preference: myProfile.gender_preference || null,
      looking_for: myProfile.looking_for || null,
      is_visible: myProfile.is_visible,
      profile_photo_url: myProfile.profile_photo_url || null,
      show_photo: myProfile.show_photo,
      schedule: myProfile.schedule.length ? myProfile.schedule : null,
    };

    const { error } = await supabase.from("profiles").update(updatePayload).eq("id", userId);
    setIsSaving(false);
    if (error) { Alert.alert("Save failed", error.message); return; }
    Alert.alert("Saved", "Your workout profile has been updated.");
    setShowProfileSetup(false);
    await fetchPartners(userId);
  };

  const applyFilters = async () => {
    if (!userId) return;
    setShowFilters(false);
    await fetchPartners(userId, {
      city: filterCity, minAge: filterMinAge, maxAge: filterMaxAge,
      goal: filterGoal, workoutType: filterWorkoutType, gender: filterGender,
    });
  };

  const clearFilters = async () => {
    setFilterCity(""); setFilterMinAge(""); setFilterMaxAge("");
    setFilterGoal(""); setFilterWorkoutType(""); setFilterGender("");
    setShowFilters(false);
    if (userId) await fetchPartners(userId);
  };

  const handleSwipe = (direction: "left" | "right") => {
    const toX = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(swipeAnim, {
      toValue: { x: toX, y: 0 }, duration: 250, useNativeDriver: false,
    }).start(async () => {
      if (direction === "right" && userId) {
        const partner = partners[cardIndex];
        if (partner) {
          const newInterested = new Set(interestedIds);
          newInterested.add(partner.id);
          setInterestedIds(newInterested);

          // Check if other person already swiped right on us
          const { data: existingMatch } = await supabase
            .from("workout_matches")
            .select("id")
            .eq("user1_id", partner.id)
            .eq("user2_id", userId)
            .single();

          if (existingMatch) {
            // It's a match
            Alert.alert("It's a match!", `You and ${partner.first_name ?? "this person"} are both interested!`);
          } else {
            // Record our interest
            await supabase.from("workout_matches").insert({
              user1_id: userId,
              user2_id: partner.id,
            });
          }
          await loadMatches(userId);
        }
      }
      swipeAnim.setValue({ x: 0, y: 0 });
      setSwipeDirection(null);
      setCardIndex((prev) => prev + 1);
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      swipeAnim.setValue({ x: gestureState.dx, y: gestureState.dy });
      setSwipeDirection(gestureState.dx > 0 ? "right" : "left");
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SWIPE_THRESHOLD) handleSwipe("right");
      else if (gestureState.dx < -SWIPE_THRESHOLD) handleSwipe("left");
      else {
        Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        setSwipeDirection(null);
      }
    },
  });

  const rotate = swipeAnim.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const currentCard = partners[cardIndex];

  const renderCardPhoto = (partner: WorkoutProfile) => {
    if (partner.show_photo === false || !partner.profile_photo_url) {
      return (
        <View style={[styles.cardAvatar, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
          <FontAwesome name="user-circle" size={52} color="#d40000" />
        </View>
      );
    }
    return <Image source={{ uri: partner.profile_photo_url }} style={styles.cardAvatarPhoto} contentFit="cover" />;
  };

  const renderListPhoto = (partner: WorkoutProfile) => {
    if (partner.show_photo === false || !partner.profile_photo_url) {
      return (
        <View style={[styles.listAvatar, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
          <FontAwesome name="user-circle" size={28} color="#d40000" />
        </View>
      );
    }
    return <Image source={{ uri: partner.profile_photo_url }} style={styles.listAvatarPhoto} contentFit="cover" />;
  };

  const renderMatchPhoto = (match: Match) => {
    if (!match.other_show_photo || !match.other_photo_url) {
      return (
        <View style={[styles.matchAvatar, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
          <FontAwesome name="user-circle" size={24} color="#d40000" />
        </View>
      );
    }
    return <Image source={{ uri: match.other_photo_url }} style={styles.matchAvatarPhoto} contentFit="cover" />;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#d40000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: textColor }]}>{t.title}</Text>
            <Text style={[styles.sub, { color: subColor }]}>{t.sub}</Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => setShowFilters(true)}
            >
              <FontAwesome name="sliders" size={16} color="#d40000" />
              <Text style={styles.iconBtnLabel}>{t.filters}</Text>
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => setShowProfileSetup(true)}
            >
              <FontAwesome name="user-circle-o" size={16} color="#d40000" />
              <Text style={styles.iconBtnLabel}>{t.setupProfile}</Text>
            </Pressable>
          </View>
        </View>

        {/* MY PROFILE SUMMARY */}
        {myProfile.workout_goal || myProfile.city ? (
          <View style={[styles.myProfileBadge, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.myProfileLeft}>
              <FontAwesome name="bolt" size={14} color="#d40000" />
              <Text style={[styles.myProfileText, { color: textColor }]} numberOfLines={1}>
                {myProfile.first_name ? `${myProfile.first_name} · ` : ""}
                {myProfile.workout_goal || ""}
                {myProfile.city ? ` · ${myProfile.city}` : ""}
              </Text>
            </View>
            <Pressable onPress={() => setShowProfileSetup(true)}>
              <Text style={styles.editLink}>{t.editProfile}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={[styles.setupPrompt, { backgroundColor: "#d40000" }]} onPress={() => setShowProfileSetup(true)}>
            <FontAwesome name="user-plus" size={14} color="#fff" />
            <Text style={styles.setupPromptText}>{t.setupProfile}</Text>
          </Pressable>
        )}

        {/* SWIPE CARDS */}
        <View style={styles.cardStack}>
          {partners.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <FontAwesome name="users" size={32} color={subColor} />
              <Text style={[styles.emptyText, { color: subColor }]}>{t.noMore}</Text>
            </View>
          ) : cardIndex >= partners.length ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <FontAwesome name="check-circle" size={32} color="#d40000" />
              <Text style={[styles.emptyText, { color: subColor }]}>{t.noMore}</Text>
            </View>
          ) : (
            <>
              {partners[cardIndex + 1] ? (
                <View style={[styles.bgCard, { backgroundColor: cardBg, borderColor: cardBorder }]} />
              ) : null}
              <Animated.View
                style={[
                  styles.swipeCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: swipeDirection === "right" ? "#00cc66" : swipeDirection === "left" ? "#d40000" : cardBorder,
                    transform: [{ translateX: swipeAnim.x }, { translateY: swipeAnim.y }, { rotate }],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                {swipeDirection === "right" ? (
                  <View style={styles.interestedBadge}><Text style={styles.interestedBadgeText}>INTERESTED</Text></View>
                ) : null}
                {swipeDirection === "left" ? (
                  <View style={styles.passBadge}><Text style={styles.passBadgeText}>PASS</Text></View>
                ) : null}

                {renderCardPhoto(currentCard)}

                <Text style={[styles.cardName, { color: textColor }]}>
                  {currentCard?.first_name ?? "Member"}
                  {currentCard?.age ? ` · ${currentCard.age}` : ""}
                </Text>

                {currentCard?.city ? (
                  <View style={styles.cardMetaRow}>
                    <FontAwesome name="map-marker" size={12} color={subColor} />
                    <Text style={[styles.cardMeta, { color: subColor }]}>{currentCard.city}</Text>
                  </View>
                ) : null}

                {currentCard?.workout_goal ? (
                  <View style={[styles.goalTag, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
                    <Text style={styles.goalTagText}>{currentCard.workout_goal}</Text>
                  </View>
                ) : null}

                {currentCard?.looking_for ? (
                  <View style={[styles.lookingTag, { backgroundColor: isDark ? "#1e1a2e" : "#fdf0f8" }]}>
                    <FontAwesome name="search" size={10} color="#d40000" />
                    <Text style={[styles.lookingTagText, { color: subColor }]}>{currentCard.looking_for}</Text>
                  </View>
                ) : null}

                {Array.isArray(currentCard?.schedule) && currentCard.schedule.length > 0 ? (
                  <View style={styles.cardMetaRow}>
                    <FontAwesome name="clock-o" size={11} color={subColor} />
                    <Text style={[styles.cardMeta, { color: subColor }]}>{currentCard.schedule[0]}</Text>
                  </View>
                ) : null}

                {Array.isArray(currentCard?.workout_type) && currentCard.workout_type.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {currentCard.workout_type.slice(0, 4).map((type) => (
                      <View key={type} style={[styles.typeTag, { borderColor: isDark ? "#3a3249" : "#d9cfe8" }]}>
                        <Text style={[styles.typeTagText, { color: subColor }]}>{type}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.swipeButtons}>
                  <Pressable style={styles.passButton} onPress={() => handleSwipe("left")}>
                    <FontAwesome name="times" size={22} color="#d40000" />
                    <Text style={styles.passButtonText}>{t.pass}</Text>
                  </Pressable>
                  <Pressable style={styles.interestedButton} onPress={() => handleSwipe("right")}>
                    <FontAwesome name="bolt" size={22} color="#fff" />
                    <Text style={styles.interestedButtonText}>{t.interested}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </>
          )}
        </View>

        {/* LIST */}
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: textColor }]}>{t.nearby}</Text>
          {partners.length === 0 ? (
            <Text style={[styles.emptyText, { color: subColor }]}>{t.noMore}</Text>
          ) : (
            partners.map((partner, index) => (
              <View
                key={partner.id}
                style={[styles.listCard, { backgroundColor: cardBg, borderColor: index === cardIndex ? "#d40000" : cardBorder }]}
              >
                {renderListPhoto(partner)}
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: textColor }]}>
                    {partner.first_name ?? "Member"}{partner.age ? ` · ${partner.age}` : ""}
                  </Text>
                  <Text style={[styles.listMeta, { color: subColor }]}>
                    {[partner.city, partner.workout_goal].filter(Boolean).join(" · ")}
                  </Text>
                  {Array.isArray(partner.schedule) && partner.schedule.length > 0 ? (
                    <Text style={[styles.listMeta, { color: subColor }]}>
                      <FontAwesome name="clock-o" size={10} color={subColor} /> {partner.schedule[0]}
                    </Text>
                  ) : null}
                  {Array.isArray(partner.workout_type) && partner.workout_type.length > 0 ? (
                    <View style={styles.listTagsRow}>
                      {partner.workout_type.slice(0, 3).map((type) => (
                        <View key={type} style={[styles.listTypeTag, { borderColor: isDark ? "#3a3249" : "#d9cfe8" }]}>
                          <Text style={[styles.listTypeText, { color: subColor }]}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
                {index === cardIndex ? (
                  <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>NOW</Text></View>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* BOTTOM PADDING for floating button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FLOATING CHAT BUTTON */}
      <Pressable
        style={[styles.floatingChatBtn, { backgroundColor: "#d40000" }]}
        onPress={() => setShowChat(true)}
      >
        <FontAwesome name="comments" size={22} color="#fff" />
        {matches.length > 0 ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{matches.length}</Text>
          </View>
        ) : null}
      </Pressable>

      {/* CHAT LIST MODAL */}
      <Modal visible={showChat} animationType="slide" transparent onRequestClose={() => setShowChat(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#171321" : "#fff" }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{t.messages}</Text>
              <Pressable onPress={() => setShowChat(false)}>
                <Text style={styles.modalClose}>{t.cancelEdit}</Text>
              </Pressable>
            </View>

            {matches.length === 0 ? (
              <View style={styles.noMatchesWrap}>
                <FontAwesome name="comments-o" size={48} color={subColor} />
                <Text style={[styles.noMatchesText, { color: subColor }]}>{t.noMatches}</Text>
              </View>
            ) : (
              <ScrollView>
                {matches.map((match) => (
                  <Pressable
                    key={match.id}
                    style={[styles.matchRow, { borderBottomColor: cardBorder }]}
                    onPress={() => {
                      setShowChat(false);
                      openConversation(match);
                    }}
                  >
                    {renderMatchPhoto(match)}
                    <View style={styles.matchInfo}>
                      <Text style={[styles.matchName, { color: textColor }]}>
                        {match.other_first_name ?? "Member"}
                      </Text>
                      <Text style={[styles.matchSub, { color: subColor }]}>Tap to message</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={14} color={subColor} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* CONVERSATION MODAL */}
      <Modal visible={showConversation} animationType="slide" transparent onRequestClose={closeConversation}>
        <View style={[styles.conversationContainer, { backgroundColor: bg }]}>
          {/* CONVERSATION HEADER */}
          <View style={[styles.conversationHeader, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
            <Pressable onPress={closeConversation} style={styles.backBtn}>
              <FontAwesome name="chevron-left" size={16} color="#d40000" />
              <Text style={styles.backBtnText}>{t.back}</Text>
            </Pressable>
            <Text style={[styles.conversationName, { color: textColor }]}>
              {activeMatch?.other_first_name ?? "Member"}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* MESSAGES */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const isMe = item.sender_id === userId;
              return (
                <View style={[styles.messageBubbleWrap, isMe ? styles.myBubbleWrap : styles.theirBubbleWrap]}>
                  <View style={[styles.messageBubble, isMe ? styles.myBubble : [styles.theirBubble, { backgroundColor: cardBg }]]}>
                    <Text style={[styles.messageText, { color: isMe ? "#fff" : textColor }]}>{item.content}</Text>
                    <Text style={[styles.messageTime, { color: isMe ? "rgba(255,255,255,0.6)" : subColor }]}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {/* MESSAGE INPUT */}
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.inputRow, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
              <TextInput
                style={[styles.messageInput, { backgroundColor: inputBg, color: textColor }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder={t.typeMessage}
                placeholderTextColor={subColor}
                multiline
                maxLength={500}
              />
              <Pressable
                style={[styles.sendBtn, { opacity: newMessage.trim() ? 1 : 0.4 }]}
                onPress={sendMessage}
                disabled={isSendingMessage || !newMessage.trim()}
              >
                <FontAwesome name="send" size={16} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* PROFILE SETUP MODAL */}
      <Modal visible={showProfileSetup} animationType="slide" transparent onRequestClose={() => setShowProfileSetup(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#171321" : "#fff" }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t.setupProfile}</Text>
                <Pressable onPress={() => setShowProfileSetup(false)}>
                  <Text style={styles.modalClose}>{t.cancelEdit}</Text>
                </Pressable>
              </View>

              {/* PHOTO */}
              <View style={styles.photoSection}>
                {myProfile.profile_photo_url ? (
                  <Image
                    key={myProfile.profile_photo_url}
                    source={{ uri: myProfile.profile_photo_url }}
                    style={styles.photoPreview}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
                    <FontAwesome name="user-circle" size={52} color="#d40000" />
                  </View>
                )}
                <View style={styles.photoButtons}>
                  <Pressable style={[styles.photoBtn, { borderColor: "#d40000" }]} onPress={pickAndUploadPhoto} disabled={isUploadingPhoto}>
                    <Text style={styles.photoBtnText}>{isUploadingPhoto ? "Uploading..." : t.uploadPhoto}</Text>
                  </Pressable>
                  {myProfile.profile_photo_url ? (
                    <Pressable style={[styles.photoBtn, { borderColor: subColor }]} onPress={() => setMyProfile((p) => ({ ...p, profile_photo_url: "" }))}>
                      <Text style={[styles.photoBtnText, { color: subColor }]}>{t.removePhoto}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <Pressable style={styles.visibleRow} onPress={() => setMyProfile((p) => ({ ...p, show_photo: !p.show_photo }))}>
                <FontAwesome name={myProfile.show_photo ? "toggle-on" : "toggle-off"} size={28} color={myProfile.show_photo ? "#d40000" : subColor} />
                <Text style={[styles.visibleText, { color: textColor }]}>{t.showPhoto}</Text>
              </Pressable>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.city}</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBg, color: textColor }]} value={myProfile.city} onChangeText={(v) => setMyProfile((p) => ({ ...p, city: v }))} placeholder="e.g. Toronto" placeholderTextColor={subColor} />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.postalCode}</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBg, color: textColor }]} value={myProfile.postal_code} onChangeText={(v) => setMyProfile((p) => ({ ...p, postal_code: v }))} placeholder="e.g. M5V 2T6" placeholderTextColor={subColor} autoCapitalize="characters" />
              <Text style={[styles.postalNote, { color: subColor }]}>Your postal code is private and only used for local matching.</Text>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.age}</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBg, color: textColor }]} value={myProfile.age} onChangeText={(v) => setMyProfile((p) => ({ ...p, age: v }))} placeholder="e.g. 25" placeholderTextColor={subColor} keyboardType="number-pad" />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.workoutGoal}</Text>
              <View style={styles.chipsWrap}>
                {WORKOUT_GOALS.map((goal) => {
                  const active = myProfile.workout_goal === goal;
                  return (
                    <Pressable key={goal} style={[styles.chip, active && styles.chipActive]} onPress={() => setMyProfile((p) => ({ ...p, workout_goal: active ? "" : goal }))}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{goal}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.myWorkoutTypes}</Text>
              <View style={styles.chipsWrap}>
                {WORKOUT_TYPES.map((type) => {
                  const active = myProfile.workout_type.includes(type);
                  return (
                    <Pressable key={type} style={[styles.chip, active && styles.chipActive]} onPress={() => {
                      const next = active ? myProfile.workout_type.filter((t) => t !== type) : [...myProfile.workout_type, type];
                      setMyProfile((p) => ({ ...p, workout_type: next }));
                    }}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.schedule}</Text>
              <View style={styles.chipsWrap}>
                {SCHEDULE_OPTIONS.map((opt) => {
                  const active = myProfile.schedule.includes(opt);
                  return (
                    <Pressable key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => {
                      const next = active ? myProfile.schedule.filter((s) => s !== opt) : [...myProfile.schedule, opt];
                      setMyProfile((p) => ({ ...p, schedule: next }));
                    }}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.lookingFor}</Text>
              <View style={styles.chipsWrap}>
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const active = myProfile.looking_for === opt;
                  return (
                    <Pressable key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setMyProfile((p) => ({ ...p, looking_for: active ? "" : opt }))}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.genderPref}</Text>
              <View style={styles.chipsWrap}>
                {GENDER_PREFERENCE_OPTIONS.map((opt) => {
                  const active = myProfile.gender_preference === opt;
                  return (
                    <Pressable key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setMyProfile((p) => ({ ...p, gender_preference: opt }))}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.visibleRow} onPress={() => setMyProfile((p) => ({ ...p, is_visible: !p.is_visible }))}>
                <FontAwesome name={myProfile.is_visible ? "toggle-on" : "toggle-off"} size={28} color={myProfile.is_visible ? "#d40000" : subColor} />
                <Text style={[styles.visibleText, { color: textColor }]}>{t.visible}</Text>
              </Pressable>

              <Pressable style={styles.saveButton} onPress={saveProfile} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : t.saveProfile}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FILTERS MODAL */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#171321" : "#fff" }]}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t.filters}</Text>
                <Pressable onPress={() => setShowFilters(false)}>
                  <Text style={styles.modalClose}>{t.cancelEdit}</Text>
                </Pressable>
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.city}</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBg, color: textColor }]} value={filterCity} onChangeText={setFilterCity} placeholder="e.g. Toronto" placeholderTextColor={subColor} />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.minAge}</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBg, color: textColor }]} value={filterMinAge} onChangeText={setFilterMinAge} placeholder="e.g. 18" placeholderTextColor={subColor} keyboardType="number-pad" />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.maxAge}</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBg, color: textColor }]} value={filterMaxAge} onChangeText={setFilterMaxAge} placeholder="e.g. 40" placeholderTextColor={subColor} keyboardType="number-pad" />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.workoutGoal}</Text>
              <View style={styles.chipsWrap}>
                {WORKOUT_GOALS.map((goal) => {
                  const active = filterGoal === goal;
                  return (
                    <Pressable key={goal} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilterGoal(active ? "" : goal)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{goal}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.workoutType}</Text>
              <View style={styles.chipsWrap}>
                {WORKOUT_TYPES.map((type) => {
                  const active = filterWorkoutType === type;
                  return (
                    <Pressable key={type} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilterWorkoutType(active ? "" : type)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.genderPref}</Text>
              <View style={styles.chipsWrap}>
                {GENDER_PREFERENCE_OPTIONS.map((opt) => {
                  const active = filterGender === opt;
                  return (
                    <Pressable key={opt} style={[styles.chip, active && styles.chipActive]} onPress={() => setFilterGender(active ? "" : opt)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.saveButton} onPress={applyFilters}>
                <Text style={styles.saveButtonText}>{t.applyFilters}</Text>
              </Pressable>
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>{t.clearFilters}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 },
  headerLeft: { flex: 1, minWidth: 120 },
  title: { fontSize: 28, fontWeight: "800" },
  sub: { marginTop: 4, fontSize: 13 },
  headerButtons: { flexDirection: "row", gap: 8, flexShrink: 0 },
  iconBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  iconBtnLabel: { color: "#d40000", fontSize: 12, fontWeight: "700" },
  myProfileBadge: { marginTop: 14, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  myProfileLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  myProfileText: { fontSize: 13, fontWeight: "600", flex: 1 },
  editLink: { color: "#d40000", fontSize: 12, fontWeight: "700" },
  setupPrompt: { marginTop: 14, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  setupPromptText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cardStack: { marginTop: 20, alignItems: "center", height: 440 },
  emptyCard: { width: SCREEN_WIDTH - 36, borderRadius: 20, borderWidth: 1, height: 380, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  bgCard: { position: "absolute", width: SCREEN_WIDTH - 56, height: 400, borderRadius: 20, borderWidth: 1, top: 10 },
  swipeCard: { position: "absolute", width: SCREEN_WIDTH - 36, borderRadius: 20, borderWidth: 2, padding: 20, alignItems: "center", paddingBottom: 16 },
  interestedBadge: { position: "absolute", top: 20, left: 20, backgroundColor: "#00cc66", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  interestedBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  passBadge: { position: "absolute", top: 20, right: 20, backgroundColor: "#d40000", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  passBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cardAvatar: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardAvatarPhoto: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  cardName: { fontSize: 22, fontWeight: "800" },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  cardMeta: { fontSize: 13 },
  goalTag: { marginTop: 10, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  goalTagText: { color: "#d40000", fontWeight: "700", fontSize: 13 },
  lookingTag: { marginTop: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 6 },
  lookingTagText: { fontSize: 12, fontWeight: "600" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "center" },
  typeTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  typeTagText: { fontSize: 11, fontWeight: "600" },
  swipeButtons: { flexDirection: "row", gap: 16, marginTop: 18 },
  passButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 2, borderColor: "#d40000", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  passButtonText: { color: "#d40000", fontWeight: "700" },
  interestedButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#d40000", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  interestedButtonText: { color: "#fff", fontWeight: "700" },
  listSection: { marginTop: 28 },
  listTitle: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  listCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  listAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  listAvatarPhoto: { width: 48, height: 48, borderRadius: 24 },
  listInfo: { flex: 1 },
  listName: { fontSize: 16, fontWeight: "700" },
  listMeta: { marginTop: 2, fontSize: 12 },
  listTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  listTypeTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  listTypeText: { fontSize: 10, fontWeight: "600" },
  currentBadge: { backgroundColor: "#d40000", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  currentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  floatingChatBtn: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  matchBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#fff", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#d40000" },
  matchBadgeText: { color: "#d40000", fontSize: 10, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: "92%", paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalClose: { color: "#d40000", fontWeight: "700" },
  noMatchesWrap: { alignItems: "center", paddingVertical: 48, gap: 14 },
  noMatchesText: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  matchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  matchAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  matchAvatarPhoto: { width: 44, height: 44, borderRadius: 22 },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 16, fontWeight: "700" },
  matchSub: { fontSize: 12, marginTop: 2 },
  conversationContainer: { flex: 1 },
  conversationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, width: 60 },
  backBtnText: { color: "#d40000", fontWeight: "700" },
  conversationName: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  messagesList: { padding: 16, gap: 8 },
  messageBubbleWrap: { flexDirection: "row" },
  myBubbleWrap: { justifyContent: "flex-end" },
  theirBubbleWrap: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: "#d40000", borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: "right" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 12, borderTopWidth: 1 },
  messageInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#d40000", alignItems: "center", justifyContent: "center" },
  photoSection: { alignItems: "center", marginBottom: 8 },
  photoPreview: { width: 90, height: 90, borderRadius: 45, marginBottom: 10, backgroundColor: "#2a2237" },
  photoPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  photoButtons: { flexDirection: "row", gap: 10 },
  photoBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  photoBtnText: { color: "#d40000", fontWeight: "700", fontSize: 12 },
  inputLabel: { fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  input: { borderRadius: 10, padding: 12, fontSize: 14 },
  postalNote: { fontSize: 11, marginTop: 4 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#3a3249", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: "#d40000", borderColor: "#d40000" },
  chipText: { color: "#9c92b1", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  visibleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 },
  visibleText: { fontSize: 14, fontWeight: "600" },
  saveButton: { marginTop: 20, backgroundColor: "#d40000", borderRadius: 12, height: 48, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  clearButton: { marginTop: 10, borderRadius: 12, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#d40000" },
  clearButtonText: { color: "#d40000", fontWeight: "700" },
});