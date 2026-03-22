import { FontAwesome } from "@expo/vector-icons";
import { useAppLanguage } from "@/hooks/use-app-language";
import { Tabs } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function TabsLayout() {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const { isFrench } = useAppLanguage();

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem("app_theme_mode");
      if (saved === "light" || saved === "dark") {
        setThemeMode(saved);
      }
    };
    void loadTheme();
  }, []);

  const isDark = themeMode === "dark";

  return (
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
          fontSize: 11,
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
          title: isFrench ? "Workout" : "Workout",
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
  );
}

