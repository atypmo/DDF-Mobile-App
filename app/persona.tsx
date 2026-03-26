import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAppTheme } from "@/hooks/use-app-theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";

type PersonaType = "youth" | "youngpro" | "entrepreneur" | "partner";

type PersonaProfile = {
  type: PersonaType;
  createdAt: string;
  quote: string;
  age: string;
  location: string;
  postalCodeTail: string;
  education: string;
  goals: string[];
  frustrations: string[];
  motivation: { community: number; growth: number; recognition: number; wealth: number; culture: number };
  personality: { extrovert: number; feeling: number; intuition: number };
  featuresUsed: string[];
  channels: string[];
  profilePhotoUrl: string;
};

function normalizePersonaProfile(raw: Partial<PersonaProfile>): PersonaProfile {
  return {
    type: (raw.type as PersonaType) ?? "youngpro",
    createdAt: raw.createdAt ?? new Date().toISOString(),
    quote: raw.quote ?? "",
    age: raw.age ?? "",
    location: raw.location ?? "",
    postalCodeTail: raw.postalCodeTail ?? "",
    education: raw.education ?? "",
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    frustrations: Array.isArray(raw.frustrations) ? raw.frustrations : [],
    motivation: {
      community: raw.motivation?.community ?? 80,
      growth: raw.motivation?.growth ?? 80,
      recognition: raw.motivation?.recognition ?? 60,
      wealth: raw.motivation?.wealth ?? 70,
      culture: raw.motivation?.culture ?? 75,
    },
    personality: {
      extrovert: raw.personality?.extrovert ?? 60,
      feeling: raw.personality?.feeling ?? 45,
      intuition: raw.personality?.intuition ?? 70,
    },
    featuresUsed: Array.isArray(raw.featuresUsed) ? raw.featuresUsed : [],
    channels: Array.isArray(raw.channels) ? raw.channels : [],
    profilePhotoUrl: raw.profilePhotoUrl ?? "",
  };
}

const FEATURE_OPTIONS = [
  "Workout Buddy",
  "Certifications",
  "Job Board",
  "Events",
  "Community Groups",
  "Mental Health",
  "Business Tools",
  "Donations",
];

const CHANNEL_OPTIONS = ["Instagram", "LinkedIn", "Email", "Podcasts", "Facebook", "Website"];

const PERSONA_OPTIONS: Record<
  PersonaType,
  { label: string; emoji: string; accent: string; role: string; defaultQuote: string }
> = {
  youth: {
    label: "Youth Member",
    emoji: "🧒",
    accent: "#FFB830",
    role: "Student",
    defaultQuote: "I want to learn stuff that feels real and useful.",
  },
  youngpro: {
    label: "Young Professional",
    emoji: "🧑‍💻",
    accent: "#D4A843",
    role: "Junior Professional",
    defaultQuote: "I know where I want to go; I need the right support.",
  },
  entrepreneur: {
    label: "Entrepreneur",
    emoji: "👩‍💼",
    accent: "#3EC9A7",
    role: "Founder",
    defaultQuote: "I built something real, now I need tools to scale.",
  },
  partner: {
    label: "Community Partner",
    emoji: "👨‍💼",
    accent: "#A78BFA",
    role: "Program Director",
    defaultQuote: "Impact grows faster with better collaboration tools.",
  },
};

function buildDefaultProfile(type: PersonaType): PersonaProfile {
  const p = PERSONA_OPTIONS[type];
  return {
    type,
    createdAt: new Date().toISOString(),
    quote: p.defaultQuote,
    age: "22",
    location: "Toronto, CA",
    postalCodeTail: "",
    education: "Bachelor's",
    goals: [
      "Build a meaningful professional network",
      "Earn certifications to advance",
      "Find a mentor with relevant experience",
    ],
    frustrations: [
      "Career advancement feels slow",
      "Hard to find accessible mentors",
      "Resources are scattered",
    ],
    motivation: { community: 90, growth: 82, recognition: 60, wealth: 75, culture: 86 },
    personality: { extrovert: 60, feeling: 45, intuition: 70 },
    featuresUsed: ["Workout Buddy", "Events", "Mental Health"],
    channels: ["Instagram", "LinkedIn", "Email"],
    profilePhotoUrl: "",
  };
}

export default function PersonaScreen() {
  const { isDark } = useAppTheme();
  const { isFrench } = useAppLanguage();
  const { firstTime } = useLocalSearchParams<{ firstTime?: string }>();
  const isFirstTime = firstTime === "true";

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("Member");
  const [persona, setPersona] = useState<PersonaProfile | null>(null);
  const [draft, setDraft] = useState<PersonaProfile | null>(null);
  const [selectedType, setSelectedType] = useState<PersonaType>("youngpro");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("first_name, postal_code")
        .eq("id", user.id)
        .single();
      if (data?.first_name) setFirstName(data.first_name);
      const profilePostal = typeof data?.postal_code === "string" ? data.postal_code.trim() : "";

      const raw = await AsyncStorage.getItem(`persona_data_${user.id}`);
      if (raw) {
        const parsed = normalizePersonaProfile(JSON.parse(raw) as Partial<PersonaProfile>);
        if (!parsed.postalCodeTail && profilePostal) {
          parsed.postalCodeTail = profilePostal;
        }
        setPersona(parsed);
        setDraft(parsed);
        setSelectedType(parsed.type);
      } else {
        const next = buildDefaultProfile(selectedType);
        if (profilePostal) {
          next.postalCodeTail = profilePostal;
        }
        setDraft(next);
      }

      const { data: cloudPersona } = await supabase
        .from("persona_profiles")
        .select("payload")
        .eq("user_id", user.id)
        .single();
      if (cloudPersona?.payload) {
        const parsedCloud = normalizePersonaProfile(cloudPersona.payload as Partial<PersonaProfile>);
        if (!parsedCloud.postalCodeTail && profilePostal) {
          parsedCloud.postalCodeTail = profilePostal;
        }
        setPersona(parsedCloud);
        setDraft(parsedCloud);
        setSelectedType(parsedCloud.type);
        await AsyncStorage.setItem(`persona_data_${user.id}`, JSON.stringify(parsedCloud));
      }
    };
    void load();
  }, []);

  const t = useMemo(
    () => ({
      title: isFrench ? "Personas utilisateur" : "User Personas",
      firstPrompt: isFrench
        ? "Premiere visite. Creez votre persona pour personnaliser votre experience."
        : "First visit. Create your persona to personalize your experience.",
      chooseType: isFrench ? "Choisissez un type" : "Choose persona type",
      create: isFrench ? "Creer persona" : "Create Persona",
      save: isFrench ? "Enregistrer" : "Save",
      back: isFrench ? "Retour" : "Back to Home",
      edit: isFrench ? "Modifier" : "Edit Persona",
      cancel: isFrench ? "Annuler" : "Cancel",
      goals: isFrench ? "Objectifs" : "Goals",
      frustrations: isFrench ? "Frustrations" : "Frustrations",
      motivation: isFrench ? "Motivation" : "Motivation",
      personality: isFrench ? "Personnalite" : "Personality",
      postal: isFrench ? "Code postal (3 chiffres)" : "Postal code (last 3 digits)",
      features: isFrench ? "Fonctionnalites" : "App Features Used",
      social: isFrench ? "Reseaux" : "Social Media",
      quote: isFrench ? "Citation" : "Quote",
      age: isFrench ? "Age" : "Age",
      location: isFrench ? "Lieu" : "Location",
      education: isFrench ? "Education" : "Education",
    }),
    [isFrench]
  );

  const createPersona = async () => {
    if (!userId || !draft) return;
    const next = { ...draft, type: selectedType, createdAt: new Date().toISOString() };
    await AsyncStorage.setItem(`persona_data_${userId}`, JSON.stringify(next));
    await supabase.from("persona_profiles").upsert({ user_id: userId, payload: next });
    setPersona(next);
    setDraft(next);
    setIsEditing(false);
  };

  const saveEdits = async () => {
    if (!userId || !draft) return;
    await AsyncStorage.setItem(`persona_data_${userId}`, JSON.stringify(draft));
    await supabase.from("persona_profiles").upsert({ user_id: userId, payload: draft });
    setPersona(draft);
    setIsEditing(false);
  };

  const setDraftField = <K extends keyof PersonaProfile>(key: K, value: PersonaProfile[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };
  const addGoal = () => setDraftField("goals", [...current.goals, ""]);
  const removeGoal = (index: number) =>
    setDraftField(
      "goals",
      current.goals.filter((_, i) => i !== index)
    );
  const addFrustration = () => setDraftField("frustrations", [...current.frustrations, ""]);
  const removeFrustration = (index: number) =>
    setDraftField(
      "frustrations",
      current.frustrations.filter((_, i) => i !== index)
    );

  const current = normalizePersonaProfile(draft ?? buildDefaultProfile(selectedType));
  const meta = PERSONA_OPTIONS[current.type];
  const ageNumber = Number.parseInt(current.age, 10);
  const canShowPhotoOption = Number.isFinite(ageNumber) && ageNumber >= 19;

  const renderMeter = (label: string, value: number) => (
    <View style={styles.meterRow} key={label}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${value}%`, backgroundColor: meta.accent }]} />
      </View>
      <Text style={styles.meterValue}>{value}</Text>
    </View>
  );

  const renderRange = (
    label: string,
    value: number,
    onChange: (next: number) => void,
    minLabel: string,
    maxLabel: string
  ) => (
    <View style={styles.rangeRow} key={label}>
      <Text style={styles.rangeTitle}>{label}</Text>
      <View style={styles.rangeButtons}>
        <Text style={styles.sideLabel}>{minLabel}</Text>
        {[20, 40, 60, 80].map((v) => (
          <Pressable
            key={`${label}-${v}`}
            style={[styles.dot, value >= v && { backgroundColor: meta.accent, borderColor: meta.accent }]}
            onPress={() => onChange(v)}
          />
        ))}
        <Text style={styles.sideLabel}>{maxLabel}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#0f0c15" : "#f7f4fb" }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: "#d40000" }]}>DFF COMMUNITY APP</Text>
        <Text style={[styles.pageHeading, { color: isDark ? "#fff" : "#171321" }]}>{t.title}</Text>

        {!persona && !isEditing ? (
          <View style={[styles.card, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}> 
            <Text style={[styles.subText, { color: isDark ? "#cec7dd" : "#4f4761" }]}>{isFirstTime ? t.firstPrompt : t.chooseType}</Text>

            <View style={styles.choiceWrap}>
              {(Object.keys(PERSONA_OPTIONS) as PersonaType[]).map((type) => {
                const p = PERSONA_OPTIONS[type];
                const active = selectedType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.choiceChip, active && { borderColor: p.accent, backgroundColor: "rgba(255,255,255,0.06)" }]}
                    onPress={() => {
                      setSelectedType(type);
                      setDraft(buildDefaultProfile(type));
                    }}
                  >
                    <Text style={styles.choiceEmoji}>{p.emoji}</Text>
                    <Text style={[styles.choiceText, { color: isDark ? "#fff" : "#2f2840" }]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.primaryButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.primaryButtonText}>{t.create}</Text>
            </Pressable>
          </View>
        ) : null}

        {isEditing ? (
          <View style={[styles.editorCard, { backgroundColor: isDark ? "#171321" : "#fff", borderColor: isDark ? "#2a2338" : "#ebe2f3" }]}> 
            <Text style={styles.sectionHeader}>{t.quote}</Text>
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
              value={current.quote}
              onChangeText={(v) => setDraftField("quote", v)}
              placeholder={t.quote}
              placeholderTextColor={isDark ? "#b1a9c2" : "#958ca8"}
            />

            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.inputLabel}>{t.age}</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
                  value={current.age}
                  onChangeText={(v) => setDraftField("age", v)}
                />
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.inputLabel}>{t.location}</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
                  value={current.location}
                  onChangeText={(v) => setDraftField("location", v)}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>{t.education}</Text>
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
              value={current.education}
              onChangeText={(v) => setDraftField("education", v)}
            />

            <Text style={styles.inputLabel}>{t.postal}</Text>
            <TextInput
              style={[styles.input, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
              value={current.postalCodeTail}
              onChangeText={(v) => setDraftField("postalCodeTail", v.replace(/\D/g, "").slice(0, 3))}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="123"
              placeholderTextColor={isDark ? "#b1a9c2" : "#958ca8"}
            />

            {canShowPhotoOption ? (
              <>
                <Text style={styles.inputLabel}>Profile Photo URL (19+)</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
                  value={current.profilePhotoUrl}
                  onChangeText={(v) => setDraftField("profilePhotoUrl", v)}
                  placeholder="https://..."
                  placeholderTextColor={isDark ? "#b1a9c2" : "#958ca8"}
                  autoCapitalize="none"
                />
              </>
            ) : null}

            <Text style={styles.sectionHeader}>{t.goals}</Text>
            {current.goals.map((g, i) => (
              <View key={`goal-${i}`} style={styles.arrayRow}>
                <TextInput
                  style={[styles.input, styles.arrayInput, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
                  value={g}
                  onChangeText={(v) => {
                    const next = [...current.goals];
                    next[i] = v;
                    setDraftField("goals", next);
                  }}
                />
                <Pressable style={styles.removeBtn} onPress={() => removeGoal(i)}>
                  <Text style={styles.removeBtnText}>-</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addBtn} onPress={addGoal}>
              <Text style={styles.addBtnText}>+ Add Goal</Text>
            </Pressable>

            <Text style={styles.sectionHeader}>{t.frustrations}</Text>
            {current.frustrations.map((g, i) => (
              <View key={`fr-${i}`} style={styles.arrayRow}>
                <TextInput
                  style={[styles.input, styles.arrayInput, { color: isDark ? "#fff" : "#1f1730", backgroundColor: isDark ? "#241d31" : "#f2edf9" }]}
                  value={g}
                  onChangeText={(v) => {
                    const next = [...current.frustrations];
                    next[i] = v;
                    setDraftField("frustrations", next);
                  }}
                />
                <Pressable style={styles.removeBtn} onPress={() => removeFrustration(i)}>
                  <Text style={styles.removeBtnText}>-</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addBtn} onPress={addFrustration}>
              <Text style={styles.addBtnText}>+ Add Frustration</Text>
            </Pressable>

            <Text style={styles.sectionHeader}>{t.features}</Text>
            <View style={styles.chipsWrap}>
              {FEATURE_OPTIONS.map((f) => {
                const active = current.featuresUsed.includes(f);
                return (
                  <Pressable
                    key={f}
                    style={[styles.optionChip, active && { backgroundColor: `${meta.accent}22`, borderColor: meta.accent }]}
                    onPress={() => {
                      const next = active
                        ? current.featuresUsed.filter((x) => x !== f)
                        : [...current.featuresUsed, f];
                      setDraftField("featuresUsed", next);
                    }}
                  >
                    <Text style={[styles.optionChipText, active && { color: meta.accent }]}>{f}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionHeader}>{t.social}</Text>
            <View style={styles.chipsWrap}>
              {CHANNEL_OPTIONS.map((c) => {
                const active = current.channels.includes(c);
                return (
                  <Pressable
                    key={c}
                    style={[styles.optionChip, active && { backgroundColor: `${meta.accent}22`, borderColor: meta.accent }]}
                    onPress={() => {
                      const next = active ? current.channels.filter((x) => x !== c) : [...current.channels, c];
                      setDraftField("channels", next);
                    }}
                  >
                    <Text style={[styles.optionChipText, active && { color: meta.accent }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionHeader}>{t.motivation}</Text>
            {renderRange(
              "Community",
              current.motivation.community,
              (next) => setDraftField("motivation", { ...current.motivation, community: next }),
              "Low",
              "High"
            )}
            {renderRange(
              "Growth",
              current.motivation.growth,
              (next) => setDraftField("motivation", { ...current.motivation, growth: next }),
              "Low",
              "High"
            )}
            {renderRange(
              "Recognition",
              current.motivation.recognition,
              (next) => setDraftField("motivation", { ...current.motivation, recognition: next }),
              "Low",
              "High"
            )}
            {renderRange(
              "Wealth",
              current.motivation.wealth,
              (next) => setDraftField("motivation", { ...current.motivation, wealth: next }),
              "Low",
              "High"
            )}
            {renderRange(
              "Culture",
              current.motivation.culture,
              (next) => setDraftField("motivation", { ...current.motivation, culture: next }),
              "Low",
              "High"
            )}

            <Text style={styles.sectionHeader}>{t.personality}</Text>
            {renderRange(
              "Introvert-Extrovert",
              current.personality.extrovert,
              (next) => setDraftField("personality", { ...current.personality, extrovert: next }),
              "Introvert",
              "Extrovert"
            )}
            {renderRange(
              "Thinking-Feeling",
              current.personality.feeling,
              (next) => setDraftField("personality", { ...current.personality, feeling: next }),
              "Thinking",
              "Feeling"
            )}
            {renderRange(
              "Sensing-Intuition",
              current.personality.intuition,
              (next) => setDraftField("personality", { ...current.personality, intuition: next }),
              "Sensing",
              "Intuition"
            )}

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.secondaryButtonText}>{t.cancel}</Text>
              </Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={persona ? saveEdits : createPersona}>
                <Text style={styles.primaryButtonText}>{persona ? t.save : t.create}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {persona && !isEditing ? (
          (() => {
            const safePersona = normalizePersonaProfile(persona);
            return (
          <View style={[styles.personaCard, { borderColor: `${meta.accent}55` }]}>
            <View style={[styles.header, { backgroundColor: `${meta.accent}22` }]}>
              {canShowPhotoOption && safePersona.profilePhotoUrl ? (
                <Image source={{ uri: safePersona.profilePhotoUrl }} style={styles.avatarPhoto} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, { backgroundColor: meta.accent }]}>
                  <Text style={styles.avatarText}>{meta.emoji}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.personaType, { color: meta.accent }]}>{meta.label.toUpperCase()}</Text>
                <Text style={styles.name}>{firstName}</Text>
                <Text style={styles.role}>{meta.role}</Text>
                <Text style={styles.quote}>"{safePersona.quote}"</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaCell}><Text style={styles.metaLabel}>{t.age}</Text><Text style={styles.metaValue}>{safePersona.age}</Text></View>
              <View style={styles.metaCell}><Text style={styles.metaLabel}>{t.location}</Text><Text style={styles.metaValue}>{safePersona.location}</Text></View>
              <View style={styles.metaCell}><Text style={styles.metaLabel}>{t.education}</Text><Text style={styles.metaValue}>{safePersona.education}</Text></View>
            </View>

            <View style={styles.body}>
              <Text style={[styles.sectionLabel, { color: meta.accent }]}>{t.goals}</Text>
              {safePersona.goals.map((goal) => (
                <View key={goal} style={styles.goalRow}><View style={[styles.goalDot, { backgroundColor: meta.accent }]} /><Text style={styles.goalText}>{goal}</Text></View>
              ))}

              <View style={styles.divider} />

              <Text style={[styles.sectionLabel, { color: meta.accent }]}>{t.frustrations}</Text>
              {safePersona.frustrations.map((f) => (
                <View key={f} style={styles.frBox}><Text style={styles.frText}>{f}</Text></View>
              ))}

              <View style={styles.divider} />

              <Text style={[styles.sectionLabel, { color: meta.accent }]}>{t.motivation}</Text>
              {renderMeter("Community", safePersona.motivation.community)}
              {renderMeter("Growth", safePersona.motivation.growth)}
              {renderMeter("Recognition", safePersona.motivation.recognition)}
              {renderMeter("Wealth", safePersona.motivation.wealth)}
              {renderMeter("Culture", safePersona.motivation.culture)}

              <View style={styles.divider} />

              <Text style={[styles.sectionLabel, { color: meta.accent }]}>{t.features}</Text>
              <View style={styles.chipsWrap}>
                {safePersona.featuresUsed.map((f) => (
                  <View key={f} style={[styles.featureTag, { borderColor: meta.accent }]}>
                    <Text style={[styles.featureTagText, { color: meta.accent }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={[styles.sectionLabel, { color: meta.accent }]}>{t.personality}</Text>
              {renderMeter("Introvert-Extrovert", safePersona.personality.extrovert)}
              {renderMeter("Thinking-Feeling", safePersona.personality.feeling)}
              {renderMeter("Sensing-Intuition", safePersona.personality.intuition)}

              <View style={styles.divider} />

              <Text style={[styles.sectionLabel, { color: meta.accent }]}>{t.social}</Text>
              <View style={styles.channelsWrap}>
                {safePersona.channels.map((c) => (
                  <Text key={c} style={styles.channelText}>• {c}</Text>
                ))}
              </View>
            </View>

          <View style={styles.footer}>
            <Pressable style={styles.secondaryButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.secondaryButtonText}>{t.edit}</Text>
            </Pressable>
          </View>
          </View>
            );
          })()
        ) : null}

        <Pressable style={[styles.backBtn, { backgroundColor: isDark ? "#241d31" : "#efe9fa" }]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: isDark ? "#ddd5eb" : "#3d3450" }]}>{t.back}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
  pageTitle: { fontSize: 11, letterSpacing: 2, fontWeight: "800", textAlign: "center" },
  pageHeading: { fontSize: 34, fontWeight: "800", textAlign: "center", marginTop: 8, marginBottom: 14 },
  subText: { fontSize: 14, lineHeight: 21 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  editorCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  choiceWrap: { marginTop: 12, gap: 8 },
  choiceChip: { borderWidth: 1, borderColor: "#3a3249", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  choiceEmoji: { fontSize: 16 },
  choiceText: { fontSize: 14, fontWeight: "700" },
  inputLabel: { marginTop: 10, fontSize: 12, color: "#9c92b1", fontWeight: "700" },
  input: { marginTop: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  sectionHeader: { marginTop: 12, color: "#d40000", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  metaGrid: { flexDirection: "row", gap: 8 },
  metaCol: { flex: 1 },
  chipsWrap: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  arrayRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  arrayInput: { flex: 1 },
  removeBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#3d324f", alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#fff", fontSize: 20, lineHeight: 20, marginTop: -2 },
  addBtn: { marginTop: 6, alignSelf: "flex-start", borderRadius: 8, borderWidth: 1, borderColor: "#5a4a74", paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { color: "#d6caeb", fontWeight: "700", fontSize: 12 },
  optionChip: { borderWidth: 1, borderColor: "#3a3249", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  optionChipText: { color: "#d8d1e8", fontSize: 12, fontWeight: "700" },
  actionRow: { marginTop: 14, flexDirection: "row", gap: 10 },
  primaryButton: { marginTop: 14, height: 46, borderRadius: 10, backgroundColor: "#d40000", alignItems: "center", justifyContent: "center" },
  primaryButtonSmall: { flex: 1, height: 42, borderRadius: 10, backgroundColor: "#d40000", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  personaCard: { backgroundColor: "#171321", borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  header: { padding: 14, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  avatar: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarPhoto: { width: 50, height: 50, borderRadius: 12 },
  avatarText: { fontSize: 24 },
  personaType: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  name: { marginTop: 2, fontSize: 24, color: "#fff", fontWeight: "800" },
  role: { marginTop: 2, color: "#bcb4cf", fontSize: 12 },
  quote: { marginTop: 6, color: "#c8c0da", fontSize: 13, fontStyle: "italic" },

  metaRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#2a2338" },
  metaCell: { flex: 1, paddingVertical: 8, alignItems: "center" },
  metaLabel: { color: "#8f86a4", fontSize: 10, textTransform: "uppercase" },
  metaValue: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 },

  body: { padding: 14 },
  sectionLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  goalRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 7 },
  goalDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  goalText: { color: "#ddd5eb", fontSize: 13, lineHeight: 18, flex: 1 },
  divider: { marginVertical: 10, borderTopWidth: 1, borderTopColor: "#2a2338" },
  frBox: { backgroundColor: "#211a2e", borderRadius: 8, padding: 8, marginBottom: 6 },
  frText: { color: "#c5bdd6", fontSize: 12 },

  meterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  meterLabel: { width: 86, color: "#9c92b1", fontSize: 11 },
  meterTrack: { flex: 1, height: 5, backgroundColor: "#2f2740", borderRadius: 4, overflow: "hidden" },
  meterFill: { height: "100%", borderRadius: 4 },
  meterValue: { width: 30, textAlign: "right", color: "#b8b0ca", fontSize: 10 },

  rangeRow: { marginTop: 8 },
  rangeTitle: { color: "#d8d1e8", fontSize: 12, marginBottom: 6 },
  rangeButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  sideLabel: { color: "#9c92b1", fontSize: 10, width: 52, textAlign: "center" },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#665c7d", backgroundColor: "#241d31" },

  featureTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  featureTagText: { fontSize: 11, fontWeight: "700" },
  channelsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  channelText: { color: "#cec7dd", fontSize: 12 },

  footer: { padding: 14, borderTopWidth: 1, borderTopColor: "#2a2338" },
  secondaryButton: { flex: 1, height: 40, borderRadius: 10, backgroundColor: "#251d33", alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: "#fff", fontWeight: "700" },

  backBtn: { marginTop: 12, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 14, fontWeight: "700" },
});
