import { useAppLanguage } from "@/hooks/use-app-language";
import { supabase } from "@/lib/supabase";
import { TAB_TUTORIAL_SLIDES } from "@/lib/tab-tutorial";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useGlobalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function TabsLayout() {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const { isFrench } = useAppLanguage();
  const { tutorial } = useGlobalSearchParams<{ tutorial?: string }>();

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem("app_theme_mode");
      if (saved === "light" || saved === "dark") {
        setThemeMode(saved);
      }
    };
    void loadTheme();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTutorialState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id || !isMounted) return;

      const seenKey = `tabs_tutorial_seen_${user.id}`;
      const hasSeenTutorial = await AsyncStorage.getItem(seenKey);

      if (!hasSeenTutorial && isMounted) {
        setTutorialIndex(0);
        setShowTutorial(true);
      }
    };

    void loadTutorialState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!tutorial) return;
    setTutorialIndex(0);
    setShowTutorial(true);
  }, [tutorial]);

  const isDark = themeMode === "dark";
  const currentSlide = TAB_TUTORIAL_SLIDES[tutorialIndex];

  const closeTutorial = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      await AsyncStorage.setItem(`tabs_tutorial_seen_${user.id}`, "true");
    }

    setShowTutorial(false);
    setTutorialIndex(0);
  };

  const goToNextSlide = async () => {
    if (tutorialIndex === TAB_TUTORIAL_SLIDES.length - 1) {
      await closeTutorial();
      return;
    }

    setTutorialIndex((prev) => prev + 1);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarActiveTintColor: "#d40000",
          tabBarInactiveTintColor: isDark ? "#a7a1b5" : "#6f6780",
          tabBarStyle: {
            height: 76,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopColor: isDark ? "#2b2438" : "#e8deee",
            backgroundColor: isDark ? "#120f19" : "#ffffff",
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: isFrench ? "Accueil" : "Home",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mental-health-support"
          options={{
            title: isFrench ? "Soutien" : "Support",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="heartbeat" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="workout-partner"
          options={{
            title: isFrench ? "Partenaire" : "Workout",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="users" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: isFrench ? "Evenements" : "Events",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="contact"
          options={{
            title: isFrench ? "Contact" : "Contact",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="phone" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: isFrench ? "Reglages" : "Settings",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="cog" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        onRequestClose={() => void closeTutorial()}
      >
        <View style={styles.overlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? "#171321" : "#ffffff",
                borderColor: isDark ? "#2a2338" : "#ece0f1",
              },
            ]}
          >
            <View style={styles.modalTopRow}>
              <View style={styles.slideBadge}>
                <FontAwesome name={currentSlide.icon} size={16} color="#fff" />
                <Text style={styles.slideBadgeText}>
                  {tutorialIndex + 1}/{TAB_TUTORIAL_SLIDES.length}
                </Text>
              </View>

              <Pressable onPress={() => void closeTutorial()}>
                <Text style={styles.skipText}>
                  {isFrench ? "Passer" : "Skip"}
                </Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#fff" : "#20172d" },
              ]}
            >
              {isFrench ? currentSlide.titleFr : currentSlide.titleEn}
            </Text>

            <Text
              style={[
                styles.modalSummary,
                { color: isDark ? "#cdc5dc" : "#5f566d" },
              ]}
            >
              {isFrench ? currentSlide.summaryFr : currentSlide.summaryEn}
            </Text>

            <View
              style={[
                styles.howToBox,
                { backgroundColor: isDark ? "#231c30" : "#f8f2fb" },
              ]}
            >
              <Text style={styles.howToLabel}>
                {isFrench ? "Comment l'utiliser" : "How to use it"}
              </Text>
              <Text
                style={[
                  styles.howToText,
                  { color: isDark ? "#e6dff2" : "#483f57" },
                ]}
              >
                {isFrench ? currentSlide.howToFr : currentSlide.howToEn}
              </Text>
            </View>

            <View style={styles.dotsRow}>
              {TAB_TUTORIAL_SLIDES.map((slide, index) => (
                <View
                  key={slide.key}
                  style={[
                    styles.dot,
                    index === tutorialIndex && styles.dotActive,
                    index !== tutorialIndex && {
                      backgroundColor: isDark ? "#463d57" : "#d8cde2",
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[
                  styles.secondaryButton,
                  tutorialIndex === 0 && styles.secondaryButtonDisabled,
                ]}
                onPress={() =>
                  setTutorialIndex((prev) => Math.max(prev - 1, 0))
                }
                disabled={tutorialIndex === 0}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    tutorialIndex === 0 && styles.secondaryButtonTextDisabled,
                  ]}
                >
                  {isFrench ? "Retour" : "Back"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={() => void goToNextSlide()}
              >
                <Text style={styles.primaryButtonText}>
                  {tutorialIndex === TAB_TUTORIAL_SLIDES.length - 1
                    ? isFrench
                      ? "Commencer"
                      : "Get Started"
                    : isFrench
                      ? "Suivant"
                      : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#d40000",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slideBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  skipText: {
    color: "#d40000",
    fontSize: 14,
    fontWeight: "700",
  },
  modalTitle: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: "800",
  },
  modalSummary: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },
  howToBox: {
    marginTop: 18,
    borderRadius: 18,
    padding: 16,
  },
  howToLabel: {
    color: "#d40000",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  howToText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotActive: {
    width: 26,
    backgroundColor: "#d40000",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#f1ecf7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: "#574e67",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButtonTextDisabled: {
    color: "#8f86a0",
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#d40000",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
