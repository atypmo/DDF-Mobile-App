import { useAppLanguage } from "@/hooks/use-app-language";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { isFrench, language, persistLanguage } = useAppLanguage();
  const t = {
    signIn: isFrench ? "Se connecter" : "Sign In",
    createAccount: isFrench ? "Creer un compte" : "Create Account",
    email: "EMAIL",
    password: isFrench ? "MOT DE PASSE" : "PASSWORD",
    forgot: isFrench ? "Mot de passe oublie?" : "Forgot your password?",
    admin: isFrench ? "Connexion Admin" : "Admin Login",
    orContinue: isFrench ? "ou continuer avec" : "or continue with",
    gmail: "Gmail",
    facebook: "Facebook",
    signingIn: isFrench ? "Connexion..." : "Signing In...",
    firstInfo: isFrench
      ? "Verification email et mobile requise a la premiere connexion"
      : "Email and mobile verification required on first sign in",
    english: "English",
    french: "Francais",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGmailLoading, setIsGmailLoading] = useState(false);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);

  useEffect(() => {
    const loadMfaStatus = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const hasSms = (data?.all ?? []).some(
        (factor) => factor.factor_type === "phone" && factor.status === "verified"
      );
      setIsSmsEnabled(hasSms);
    };
    void loadMfaStatus();
  }, []);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter both email and password.");
      return;
    }
    try {
      setIsSigningIn(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert("Sign in failed", error.message);
        return;
      }
      router.replace("/(tabs)/home");
    } catch {
      Alert.alert("Sign in failed", "Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

const handleGmailSignIn = async () => {
  try {
    setIsGmailLoading(true);
    const redirectTo = "dffcommunityapp://";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      Alert.alert("Gmail sign in failed", error.message);
      return;
    }

    if (!data?.url) {
      Alert.alert("Gmail sign in failed", "Could not start OAuth flow.");
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success" || !result.url) return;

    // Parse fragment tokens from URL
    const url = result.url;
    const fragmentString = url.includes("#") ? url.split("#")[1] : "";
    const fragmentParams: Record<string, string> = {};
    fragmentString.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key && value) fragmentParams[key] = decodeURIComponent(value);
    });

    const accessToken = fragmentParams["access_token"];
    const refreshToken = fragmentParams["refresh_token"];

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        Alert.alert("Gmail sign in failed", sessionError.message);
        return;
      }
      router.replace("/(tabs)/home");
      return;
    }

    // Fallback — check if session was set automatically
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      router.replace("/(tabs)/home");
      return;
    }

    Alert.alert(
      "Sign in incomplete",
      "Could not retrieve session. Try signing in with email instead."
    );
  } catch {
    Alert.alert("Gmail sign in failed", "Please try again.");
  } finally {
    setIsGmailLoading(false);
  }
};

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter email and password for admin login.");
      return;
    }
    try {
      setIsSigningIn(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert("Admin sign in failed", error.message);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert("Admin sign in failed", "No active user session.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role,is_admin")
        .eq("id", user.id)
        .single();

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
      const metadataRole = metadata.role ?? appMetadata.role;
      const metadataIsAdmin = metadata.is_admin ?? appMetadata.is_admin;

      const isAdmin =
        profile?.role === "admin" ||
        profile?.is_admin === true ||
        metadataRole === "admin" ||
        metadataIsAdmin === true;

      if (profileError) {
        console.warn("Admin role check fallback to metadata:", profileError.message);
      }

      if (!isAdmin) {
        await supabase.auth.signOut();
        Alert.alert(
          "Access denied",
          "This account is not marked as admin. Add role='admin' or is_admin=true in profiles."
        );
        return;
      }
      router.replace("/admin-dashboard");
    } catch {
      Alert.alert("Admin sign in failed", "Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: "#fff",
          }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <LinearGradient
              colors={["#000000", "#000000", "#2a0000", "#5a0000"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
            <Image
              source={require("../assets/images/IMG_5141.png")}
              style={styles.logo}
            />
            <Text style={styles.logoText}>D F F</Text>
            <Text style={styles.foundation}>DOMINANCE FORBES FOUNDATION</Text>
            <Text style={styles.tagline}>Strength in Unity.</Text>
            <Text style={styles.tagline}>We Shape Tomorrow.</Text>
          </View>

          {/* CARD */}
          <View style={styles.card}>

            {/* LANGUAGE ROW */}
            <View style={styles.languageRow}>
              <TouchableOpacity
                style={[styles.langChip, language === "en" && styles.langChipActive]}
                onPress={() => void persistLanguage("en")}
              >
                <Text style={[styles.langChipText, language === "en" && styles.langChipTextActive]}>
                  {t.english}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langChip, language === "fr" && styles.langChipActive]}
                onPress={() => void persistLanguage("fr")}
              >
                <Text style={[styles.langChipText, language === "fr" && styles.langChipTextActive]}>
                  {t.french}
                </Text>
              </TouchableOpacity>
            </View>

            {/* TOGGLE */}
            <View style={styles.toggle}>
              <View style={styles.toggleActive}>
                <Text style={styles.toggleActiveText}>{t.signIn}</Text>
              </View>
              <TouchableOpacity
                style={styles.toggleInactive}
                onPress={() => router.push("/signup")}
              >
                <Text style={styles.toggleInactiveText}>{t.createAccount}</Text>
              </TouchableOpacity>
            </View>

            {/* EMAIL */}
            <Text style={styles.label}>{t.email}</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="username"
              importantForAutofill="yes"
            />

            {/* PASSWORD */}
            <Text style={styles.label}>{t.password}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
                textContentType="password"
                importantForAutofill="yes"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity>
              <Text style={styles.forgot}>{t.forgot}</Text>
            </TouchableOpacity>

            {/* 2FA BOX */}
            <TouchableOpacity
              style={styles.twofaBox}
              onPress={() => router.push("/mfa-setup")}
            >
              <View style={styles.twofaRow}>
                <FontAwesome name="lock" size={18} color="#d40000" />
                <Text style={styles.twofaTitle}>
                  {isSmsEnabled
                    ? "2-Step Verification enabled"
                    : "Set up 2-Step Verification"}
                </Text>
              </View>
              <Text style={styles.twofaSub}>
                {isSmsEnabled
                  ? "Authenticator app - SMS backup"
                  : "Tap here to enable SMS security"}
              </Text>
            </TouchableOpacity>

            {/* SIGN IN BUTTON */}
            <TouchableOpacity
              style={styles.signin}
              onPress={handleEmailSignIn}
              disabled={isSigningIn}
            >
              <Text style={styles.signinText}>
                {isSigningIn ? t.signingIn : t.signIn}
              </Text>
            </TouchableOpacity>

            {/* ADMIN BUTTON */}
            <TouchableOpacity
              style={styles.adminButton}
              onPress={handleAdminLogin}
            >
              <FontAwesome name="shield" size={16} color="#7a0a0a" />
              <Text style={styles.adminButtonText}>{t.admin}</Text>
            </TouchableOpacity>

            {/* DIVIDER */}
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>{t.orContinue}</Text>
              <View style={styles.line} />
            </View>

            {/* SOCIAL BUTTONS */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGmailSignIn}
                disabled={isGmailLoading}
              >
                <FontAwesome name="google" size={18} color="#4285F4" />
                <Text style={styles.socialText}>
                  {isGmailLoading ? ` ${t.gmail}...` : ` ${t.gmail}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  Alert.alert("Coming Soon", "Facebook login will be available soon.")
                }
              >
                <FontAwesome name="facebook" size={18} color="#1877F2" />
                <Text style={styles.socialText}> {t.facebook}</Text>
              </TouchableOpacity>
            </View>

            {/* APPLE BUTTON */}
            <TouchableOpacity
              style={styles.appleButton}
              onPress={() =>
                Alert.alert("Coming Soon", "Apple ID login will be available soon.")
              }
            >
              <FontAwesome name="apple" size={18} color="#fff" />
              <Text style={styles.appleButtonText}> Continue with Apple</Text>
            </TouchableOpacity>

            <Text style={styles.infoText}>{t.firstInfo}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 320,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    marginBottom: 15,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 34,
    letterSpacing: 10,
    marginTop: 4,
  },
  foundation: {
    color: "#8a8a8a",
    letterSpacing: 4,
    fontSize: 11,
    marginTop: 10,
  },
  tagline: {
    color: "#d1d1d1",
    fontSize: 17,
    marginTop: 6,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
    paddingBottom: 40,
    marginTop: -10,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  langChip: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f4f4f4",
  },
  langChipActive: {
    borderColor: "#d40000",
    backgroundColor: "#d40000",
  },
  langChipText: {
    color: "#606060",
    fontSize: 12,
    fontWeight: "700",
  },
  langChipTextActive: {
    color: "#fff",
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  toggleActive: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  toggleInactive: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  toggleActiveText: {
    fontWeight: "600",
  },
  toggleInactiveText: {
    color: "#777",
  },
  label: {
    color: "#888",
    fontSize: 12,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 12,
    marginTop: 6,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
  },
  forgot: {
    color: "#d40000",
    textAlign: "right",
    marginTop: 8,
  },
  twofaBox: {
    borderWidth: 1,
    borderColor: "#f2b6b6",
    backgroundColor: "#fff5f5",
    padding: 14,
    borderRadius: 14,
    marginTop: 15,
  },
  twofaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  twofaTitle: {
    fontWeight: "600",
    marginLeft: 6,
  },
  twofaSub: {
    color: "#777",
    marginTop: 4,
  },
  signin: {
    backgroundColor: "#d40000",
    padding: 18,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#ff0000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  signinText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  adminButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#f2c1c1",
    backgroundColor: "#fff7f7",
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  adminButtonText: {
    color: "#7a0a0a",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  dividerText: {
    marginHorizontal: 8,
    color: "#888",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  socialButton: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    justifyContent: "center",
    alignItems: "center",
  },
  socialText: {
    fontWeight: "500",
  },
  appleButton: {
    flexDirection: "row",
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  appleButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  infoText: {
    marginTop: 14,
    textAlign: "center",
    color: "#888",
    fontSize: 12,
  },
});
