import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export type AppLanguage = "en" | "fr";

let languageStore: AppLanguage = "en";
const listeners = new Set<(lang: AppLanguage) => void>();

function notifyLanguage(next: AppLanguage) {
  languageStore = next;
  listeners.forEach((fn) => fn(next));
}

export function useAppLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(languageStore);

  const refreshLanguage = useCallback(async () => {
    const saved = await AsyncStorage.getItem("app_language");
    if (saved === "en" || saved === "fr") {
      notifyLanguage(saved);
      return;
    }

    // First app launch default is always English.
    notifyLanguage("en");
    await AsyncStorage.setItem("app_language", "en");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshLanguage();
    }, [refreshLanguage])
  );

  const persistLanguage = useCallback(async (next: AppLanguage) => {
    notifyLanguage(next);
    await AsyncStorage.setItem("app_language", next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      listeners.add(setLanguage);
      setLanguage(languageStore);
      return () => {
        listeners.delete(setLanguage);
      };
    }, [])
  );

  return { language, isFrench: language === "fr", persistLanguage };
}
