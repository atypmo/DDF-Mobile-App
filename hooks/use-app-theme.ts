import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export type AppThemeMode = "dark" | "light";

export function useAppTheme() {
  const [themeMode, setThemeMode] = useState<AppThemeMode>("dark");

  const refreshTheme = useCallback(async () => {
    const saved = await AsyncStorage.getItem("app_theme_mode");
    if (saved === "light" || saved === "dark") {
      setThemeMode(saved);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshTheme();
    }, [refreshTheme])
  );

  const persistTheme = useCallback(async (mode: AppThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem("app_theme_mode", mode);
  }, []);

  return { themeMode, isDark: themeMode === "dark", persistTheme };
}
