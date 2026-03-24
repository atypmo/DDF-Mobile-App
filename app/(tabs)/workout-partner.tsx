import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
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

type WorkoutProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  age: number | null;
  workout_goal: string | null;
  workout_type: string[] | null;
  gender_preference: string | null;
  looking_for: string | null;
  is_visible: boolean | null;
};

type MyProfile = {
  first_name: string;
  city: string;
  age: string;
  workout_goal: string;
  workout_type: string[];
  gender_preference: string;
  looking_for: string;
  is_visible: boolean;
};

export default function WorkoutPartnerTab() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile>({
    first_name: "",
    city: "",
    age: "",
    workout_goal: "",
    workout_type: [],
    gender_preference: "No Preference",
    looking_for: "",
    is_visible: true,
  });
  const [partners, setPartners] = useState<WorkoutProfile[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterMinAge, setFilterMinAge] = useState("");
  const [filterMaxAge, setFilterMaxAge] = useState("");
  const [filterGoal, setFilterGoal] = useState("");
  const [filterWorkoutType, setFilterWorkoutType] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [swipeAnim] = useState(new Animated.ValueXY());
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const t = {
    title: isFrench ? "Partenaire d'entrainement" : "Workout Partner",
    sub: isFrench ? "Trouvez votre partenaire ideal." : "Find your ideal workout partner.",
    setupProfile: isFrench ? "Configurer mon profil" : "Set Up My Profile",
    saveProfile: isFrench ? "Enregistrer le profil" : "Save Profile",
    filters: isFrench ? "Filtres" : "Filters",
    applyFilters: isFrench ? "Appliquer" : "Apply Filters",
    clearFilters: isFrench ? "Effacer" : "Clear Filters",
    noMore: isFrench ? "Plus de profils pour l'instant." : "No more profiles for now.",
    nearby: isFrench ? "Partenaires disponibles" : "Available Partners",
    interested: isFrench ? "Interesse" : "Interested",
    pass: isFrench ? "Passer" : "Pass",
    city: isFrench ? "Ville" : "City",
    age: isFrench ? "Age" : "Age",
    minAge: isFrench ? "Age min" : "Min Age",
    maxAge: isFrench ? "Age max" : "Max Age",
    workoutGoal: isFrench ? "Objectif" : "Workout Goal",
    workoutType: isFrench ? "Type" : "Workout Type",
    genderPref: isFrench ? "Preference" : "Gender Preference",
    lookingFor: isFrench ? "Je cherche" : "Looking For",
    visible: isFrench ? "Visible pour les autres" : "Visible to others",
    myWorkoutTypes: isFrench ? "Mes types d'entrainement" : "My Workout Types",
    editProfile: isFrench ? "Modifier le profil" : "Edit Profile",
    cancelEdit: isFrench ? "Annuler" : "Cancel",
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) { setIsLoading(false); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name,city,age,workout_goal,workout_type,gender_preference,looking_for,is_visible")
      .eq("id", user.id)
      .single();

    if (profile) {
      setMyProfile({
        first_name: profile.first_name ?? "",
        city: profile.city ?? "",
        age: profile.age ? String(profile.age) : "",
        workout_goal: profile.workout_goal ?? "",
        workout_type: Array.isArray(profile.workout_type) ? profile.workout_type : [],
        gender_preference: profile.gender_preference ?? "No Preference",
        looking_for: profile.looking_for ?? "",
        is_visible: profile.is_visible !== false,
      });
    }

    await fetchPartners(user.id);
    setIsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadData(); }, [loadData]));

  const fetchPartners = async (
    uid: string,
    filters?: {
      city?: string;
      minAge?: string;
      maxAge?: string;
      goal?: string;
      workoutType?: string;
      gender?: string;
    }
  ) => {
    let query = supabase
      .from("profiles")
      .select("id,first_name,last_name,city,age,workout_goal,workout_type,gender_preference,looking_for,is_visible")
      .eq("is_visible", true)
      .neq("id", uid);

    if (filters?.city?.trim()) query = query.ilike("city", `%${filters.city.trim()}%`);
    if (filters?.minAge?.trim()) query = query.gte("age", parseInt(filters.minAge));
    if (filters?.maxAge?.trim()) query = query.lte("age", parseInt(filters.maxAge));
    if (filters?.goal?.trim()) query = query.eq("workout_goal", filters.goal.trim());
    if (filters?.workoutType?.trim()) query = query.contains("workout_type", [filters.workoutType.trim()]);
    if (filters?.gender?.trim() && filters.gender !== "No Preference") query = query.eq("gender_preference", filters.gender.trim());

    const { data, error } = await query.limit(20);
    if (error) { console.warn("Partners load error:", error.message); return; }
    setPartners((data as WorkoutProfile[]) ?? []);
    setCardIndex(0);
  };

  const saveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);
    const { error } = await supabase.from("profiles").update({
      city: myProfile.city.trim() || null,
      age: myProfile.age ? parseInt(myProfile.age) : null,
      workout_goal: myProfile.workout_goal || null,
      workout_type: myProfile.workout_type.length ? myProfile.workout_type : null,
      gender_preference: myProfile.gender_preference || null,
      looking_for: myProfile.looking_for || null,
      is_visible: myProfile.is_visible,
    }).eq("id", userId);

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
      city: filterCity,
      minAge: filterMinAge,
      maxAge: filterMaxAge,
      goal: filterGoal,
      workoutType: filterWorkoutType,
      gender: filterGender,
    });
  };

  const clearFilters = async () => {
    setFilterCity("");
    setFilterMinAge("");
    setFilterMaxAge("");
    setFilterGoal("");
    setFilterWorkoutType("");
    setFilterGender("");
    setShowFilters(false);
    if (userId) await fetchPartners(userId);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      swipeAnim.setValue({ x: gestureState.dx, y: gestureState.dy });
      setSwipeDirection(gestureState.dx > 0 ? "right" : "left");
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SWIPE_THRESHOLD) {
        handleSwipe("right");
      } else if (gestureState.dx < -SWIPE_THRESHOLD) {
        handleSwipe("left");
      } else {
        Animated.spring(swipeAnim, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        setSwipeDirection(null);
      }
    },
  });

  const handleSwipe = (direction: "left" | "right") => {
    const toX = direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(swipeAnim, {
      toValue: { x: toX, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (direction === "right") {
        const partner = partners[cardIndex];
        if (partner) Alert.alert("Interested!", `You expressed interest in ${partner.first_name ?? "this person"}.`);
      }
      swipeAnim.setValue({ x: 0, y: 0 });
      setSwipeDirection(null);
      setCardIndex((prev) => prev + 1);
    });
  };

  const bg = isDark ? "#0f0c15" : "#f7f4fb";
  const cardBg = isDark ? "#171321" : "#ffffff";
  const cardBorder = isDark ? "#2a2338" : "#ebe2f3";
  const textColor = isDark ? "#ffffff" : "#1f1730";
  const subColor = isDark ? "#b8b0ca" : "#6c6280";
  const inputBg = isDark ? "#241d31" : "#f2edf9";

  const currentCard = partners[cardIndex];
  const rotate = swipeAnim.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

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
          <View>
            <Text style={[styles.title, { color: textColor }]}>{t.title}</Text>
            <Text style={[styles.sub, { color: subColor }]}>{t.sub}</Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => setShowFilters(true)}
            >
              <FontAwesome name="sliders" size={16} color="#d40000" />
            </Pressable>
            <Pressable
              style={[styles.iconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => setShowProfileSetup(true)}
            >
              <FontAwesome name="user-circle-o" size={16} color="#d40000" />
            </Pressable>
          </View>
        </View>

        {/* MY PROFILE SUMMARY */}
        {myProfile.workout_goal || myProfile.city ? (
          <View style={[styles.myProfileBadge, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.myProfileLeft}>
              <FontAwesome name="bolt" size={14} color="#d40000" />
              <Text style={[styles.myProfileText, { color: textColor }]}>
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
          <Pressable
            style={[styles.setupPrompt, { backgroundColor: "#d40000" }]}
            onPress={() => setShowProfileSetup(true)}
          >
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
              {/* BACKGROUND CARD */}
              {partners[cardIndex + 1] ? (
                <View style={[styles.bgCard, { backgroundColor: cardBg, borderColor: cardBorder }]} />
              ) : null}

              {/* SWIPEABLE CARD */}
              <Animated.View
                style={[
                  styles.swipeCard,
                  {
                    backgroundColor: cardBg,
                    borderColor:
                      swipeDirection === "right"
                        ? "#00cc66"
                        : swipeDirection === "left"
                        ? "#d40000"
                        : cardBorder,
                    transform: [
                      { translateX: swipeAnim.x },
                      { translateY: swipeAnim.y },
                      { rotate },
                    ],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                {/* SWIPE INDICATORS */}
                {swipeDirection === "right" ? (
                  <View style={styles.interestedBadge}>
                    <Text style={styles.interestedBadgeText}>INTERESTED</Text>
                  </View>
                ) : null}
                {swipeDirection === "left" ? (
                  <View style={styles.passBadge}>
                    <Text style={styles.passBadgeText}>PASS</Text>
                  </View>
                ) : null}

                {/* CARD AVATAR */}
                <View style={[styles.cardAvatar, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
                  <FontAwesome name="user-circle" size={52} color="#d40000" />
                </View>

                {/* CARD INFO */}
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

                {Array.isArray(currentCard?.workout_type) && currentCard.workout_type.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {currentCard.workout_type.slice(0, 4).map((type) => (
                      <View key={type} style={[styles.typeTag, { borderColor: isDark ? "#3a3249" : "#d9cfe8" }]}>
                        <Text style={[styles.typeTagText, { color: subColor }]}>{type}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {currentCard?.gender_preference && currentCard.gender_preference !== "No Preference" ? (
                  <Text style={[styles.genderPrefText, { color: subColor }]}>
                    Prefers: {currentCard.gender_preference}
                  </Text>
                ) : null}

                {/* SWIPE BUTTONS */}
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

        {/* LIST BELOW CARDS */}
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: textColor }]}>{t.nearby}</Text>
          {partners.length === 0 ? (
            <Text style={[styles.emptyText, { color: subColor }]}>{t.noMore}</Text>
          ) : (
            partners.map((partner, index) => (
              <View
                key={partner.id}
                style={[
                  styles.listCard,
                  { backgroundColor: cardBg, borderColor: index === cardIndex ? "#d40000" : cardBorder },
                ]}
              >
                <View style={[styles.listAvatar, { backgroundColor: isDark ? "#2a2237" : "#f0e8f8" }]}>
                  <FontAwesome name="user-circle" size={28} color="#d40000" />
                </View>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, { color: textColor }]}>
                    {partner.first_name ?? "Member"}
                    {partner.age ? ` · ${partner.age}` : ""}
                  </Text>
                  <Text style={[styles.listMeta, { color: subColor }]}>
                    {[partner.city, partner.workout_goal].filter(Boolean).join(" · ")}
                  </Text>
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
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>NOW</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

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

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.city}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                value={myProfile.city}
                onChangeText={(v) => setMyProfile((p) => ({ ...p, city: v }))}
                placeholder="e.g. Toronto"
                placeholderTextColor={subColor}
              />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.age}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                value={myProfile.age}
                onChangeText={(v) => setMyProfile((p) => ({ ...p, age: v }))}
                placeholder="e.g. 25"
                placeholderTextColor={subColor}
                keyboardType="number-pad"
              />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.workoutGoal}</Text>
              <View style={styles.chipsWrap}>
                {WORKOUT_GOALS.map((goal) => {
                  const active = myProfile.workout_goal === goal;
                  return (
                    <Pressable
                      key={goal}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setMyProfile((p) => ({ ...p, workout_goal: active ? "" : goal }))}
                    >
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
                    <Pressable
                      key={type}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        const next = active
                          ? myProfile.workout_type.filter((t) => t !== type)
                          : [...myProfile.workout_type, type];
                        setMyProfile((p) => ({ ...p, workout_type: next }));
                      }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.lookingFor}</Text>
              <View style={styles.chipsWrap}>
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const active = myProfile.looking_for === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setMyProfile((p) => ({ ...p, looking_for: active ? "" : opt }))}
                    >
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
                    <Pressable
                      key={opt}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setMyProfile((p) => ({ ...p, gender_preference: opt }))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={styles.visibleRow}
                onPress={() => setMyProfile((p) => ({ ...p, is_visible: !p.is_visible }))}
              >
                <FontAwesome
                  name={myProfile.is_visible ? "toggle-on" : "toggle-off"}
                  size={28}
                  color={myProfile.is_visible ? "#d40000" : subColor}
                />
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
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                value={filterCity}
                onChangeText={setFilterCity}
                placeholder="e.g. Toronto"
                placeholderTextColor={subColor}
              />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.minAge}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                value={filterMinAge}
                onChangeText={setFilterMinAge}
                placeholder="e.g. 18"
                placeholderTextColor={subColor}
                keyboardType="number-pad"
              />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.maxAge}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                value={filterMaxAge}
                onChangeText={setFilterMaxAge}
                placeholder="e.g. 40"
                placeholderTextColor={subColor}
                keyboardType="number-pad"
              />

              <Text style={[styles.inputLabel, { color: subColor }]}>{t.workoutGoal}</Text>
              <View style={styles.chipsWrap}>
                {WORKOUT_GOALS.map((goal) => {
                  const active = filterGoal === goal;
                  return (
                    <Pressable
                      key={goal}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setFilterGoal(active ? "" : goal)}
                    >
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
                    <Pressable
                      key={type}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setFilterWorkoutType(active ? "" : type)}
                    >
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
                    <Pressable
                      key={opt}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setFilterGender(active ? "" : opt)}
                    >
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 32, fontWeight: "800" },
  sub: { marginTop: 4, fontSize: 14 },
  headerButtons: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  myProfileBadge: { marginTop: 14, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  myProfileLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  myProfileText: { fontSize: 13, fontWeight: "600", flex: 1 },
  editLink: { color: "#d40000", fontSize: 12, fontWeight: "700" },
  setupPrompt: { marginTop: 14, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  setupPromptText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cardStack: { marginTop: 20, alignItems: "center", height: 420 },
  emptyCard: { width: SCREEN_WIDTH - 36, borderRadius: 20, borderWidth: 1, height: 380, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  bgCard: { position: "absolute", width: SCREEN_WIDTH - 56, height: 370, borderRadius: 20, borderWidth: 1, top: 10 },
  swipeCard: { position: "absolute", width: SCREEN_WIDTH - 36, borderRadius: 20, borderWidth: 2, padding: 20, alignItems: "center", paddingBottom: 16 },
  interestedBadge: { position: "absolute", top: 20, left: 20, backgroundColor: "#00cc66", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  interestedBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  passBadge: { position: "absolute", top: 20, right: 20, backgroundColor: "#d40000", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  passBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cardAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
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
  genderPrefText: { marginTop: 8, fontSize: 11 },
  swipeButtons: { flexDirection: "row", gap: 16, marginTop: 18 },
  passButton: { flex: 1, height: 48, borderRadius: 14, borderWidth: 2, borderColor: "#d40000", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  passButtonText: { color: "#d40000", fontWeight: "700" },
  interestedButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: "#d40000", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  interestedButtonText: { color: "#fff", fontWeight: "700" },
  listSection: { marginTop: 28 },
  listTitle: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  listCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  listAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  listInfo: { flex: 1 },
  listName: { fontSize: 16, fontWeight: "700" },
  listMeta: { marginTop: 2, fontSize: 12 },
  listTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  listTypeTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  listTypeText: { fontSize: 10, fontWeight: "600" },
  currentBadge: { backgroundColor: "#d40000", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  currentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: "90%", paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  modalClose: { color: "#d40000", fontWeight: "700" },
  inputLabel: { fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  input: { borderRadius: 10, padding: 12, fontSize: 14 },
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