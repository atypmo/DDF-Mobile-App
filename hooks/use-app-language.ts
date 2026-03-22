import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export type AppLanguage = "en" | "fr";

export function useAppLanguage() {
  const [language, setLanguage] = useState<AppLanguage>("en");

  const refreshLanguage = useCallback(async () => {
    const saved = await AsyncStorage.getItem("app_language");
    if (saved === "en" || saved === "fr") {
      setLanguage(saved);
      return;
    }

    // First app launch default is always English.
    setLanguage("en");
    await AsyncStorage.setItem("app_language", "en");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshLanguage();
    }, [refreshLanguage])
  );

  const persistLanguage = useCallback(async (next: AppLanguage) => {
    setLanguage(next);
    await AsyncStorage.setItem("app_language", next);
  }, []);

  return { language, isFrench: language === "fr", persistLanguage };
}
