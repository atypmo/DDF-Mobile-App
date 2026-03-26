import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState(18);
  const [hideAge, setHideAge] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "prefer_not_to_say">(
    "prefer_not_to_say"
  );
  const [postalCodeTail, setPostalCodeTail] = useState("");
  const [hidePostalCode, setHidePostalCode] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [setupSms, setSetupSms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  let strengthColor = "#ff4d4d";
  let strengthWidth: `${number}%` = "25%";

  if (strength === 2) {
    strengthColor = "#ff9900";
    strengthWidth = "50%";
  }

  if (strength === 3) {
    strengthColor = "#ffd633";
    strengthWidth = "75%";
  }

  if (strength === 4) {
    strengthColor = "#00cc66";
    strengthWidth = "100%";
  }

  const handleCreateAccount = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }

    if (!consentChecked) {
      Alert.alert(
        "Consent required",
        "Please confirm consent to data processing before creating your account."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (strength < 4) {
      Alert.alert(
        "Weak password",
        "Use at least 8 chars with uppercase, number, and special character."
      );
      return;
    }

    if (!hidePostalCode && !/^\d{3}$/.test(postalCodeTail.trim())) {
      Alert.alert(
        "Postal code required",
        "Enter the last 3 digits of your postal code, or select 'Prefer not to share'."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const normalizedPostalTail = hidePostalCode ? null : postalCodeTail.trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            age: hideAge ? null : age,
            age_hidden: hideAge,
            gender,
            postal_code_tail: normalizedPostalTail,
            postal_code_hidden: hidePostalCode,
          },
        },
      });

      if (error) {
        Alert.alert("Create account failed", error.message);
        return;
      }

      const newUserId = data.user?.id ?? null;
      if (newUserId) {
        const profilePayload = {
          id: newUserId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          age: hideAge ? null : age,
          age_hidden: hideAge,
          gender,
          postal_code: normalizedPostalTail,
        };

        let profileUpsert = await supabase.from("profiles").upsert(profilePayload);
        if (profileUpsert.error && profileUpsert.error.message.toLowerCase().includes("postal_code")) {
          const { postal_code, ...legacyPayload } = profilePayload;
          profileUpsert = await supabase.from("profiles").upsert(legacyPayload);
        }

        if (profileUpsert.error) {
          console.warn("Profile upsert warning:", profileUpsert.error.message);
        }
      }

      Alert.alert(
        "Account created",
        setupSms
          ? "Account created. Sign in now, then complete SMS setup."
          : "Your account was created. If email confirmation is enabled, confirm your email before sign in.",
        [
          {
            text: "OK",
            onPress: () => router.replace(setupSms ? "/mfa-setup" : "/login"),
          },
        ]
      );
    } catch {
      Alert.alert("Create account failed", "Please try again.");
    } finally {
      setIsSubmitting(false);
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
          <View style={styles.card}>
            <View style={styles.toggle}>
              <TouchableOpacity style={styles.toggleInactive} onPress={() => router.back()}>
                <Text style={styles.toggleInactiveText}>Sign In</Text>
              </TouchableOpacity>

              <View style={styles.toggleActive}>
                <Text style={styles.toggleActiveText}>Create Account</Text>
              </View>
            </View>

            <Text style={styles.label}>FIRST NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text style={styles.label}>LAST NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
            />

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.ageHeaderRow}>
              <Text style={styles.label}>AGE</Text>
              <Text style={styles.ageValue}>{hideAge ? "Prefer not to say" : age}</Text>
            </View>

            {!hideAge && (
              <Slider
                style={styles.ageSlider}
                minimumValue={13}
                maximumValue={100}
                step={1}
                value={age}
                minimumTrackTintColor="#d40000"
                maximumTrackTintColor="#d9d9d9"
                thumbTintColor="#d40000"
                onValueChange={setAge}
              />
            )}

            <Pressable style={styles.optionRow} onPress={() => setHideAge(!hideAge)}>
              <View style={[styles.radioOuter, hideAge && styles.radioOuterActive]}>
                {hideAge && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>Prefer not to say</Text>
            </Pressable>

            <Text style={styles.label}>GENDER</Text>
            <View style={styles.genderRow}>
              <Pressable style={styles.optionRow} onPress={() => setGender("male")}>
                <View style={[styles.radioOuter, gender === "male" && styles.radioOuterActive]}>
                  {gender === "male" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Male</Text>
              </Pressable>

              <Pressable style={styles.optionRow} onPress={() => setGender("female")}>
                <View style={[styles.radioOuter, gender === "female" && styles.radioOuterActive]}>
                  {gender === "female" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Female</Text>
              </Pressable>

              <Pressable style={styles.optionRow} onPress={() => setGender("prefer_not_to_say")}>
                <View
                  style={[
                    styles.radioOuter,
                    gender === "prefer_not_to_say" && styles.radioOuterActive,
                  ]}
                >
                  {gender === "prefer_not_to_say" && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Prefer not to say</Text>
              </Pressable>
            </View>

            <View style={styles.postalHeaderRow}>
              <Text style={styles.label}>POSTAL CODE (LAST 3 DIGITS)</Text>
              <Text style={styles.postalValue}>{hidePostalCode ? "Prefer not to share" : postalCodeTail || "---"}</Text>
            </View>

            {!hidePostalCode && (
              <TextInput
                style={styles.input}
                placeholder="e.g. 123"
                value={postalCodeTail}
                onChangeText={(value) => setPostalCodeTail(value.replace(/\D/g, "").slice(0, 3))}
                keyboardType="number-pad"
                maxLength={3}
              />
            )}

            <Pressable style={styles.optionRow} onPress={() => setHidePostalCode(!hidePostalCode)}>
              <View style={[styles.radioOuter, hidePostalCode && styles.radioOuterActive]}>
                {hidePostalCode && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>Prefer not to share</Text>
            </Pressable>

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="********"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.strengthBarContainer}>
              <View
                style={[
                  styles.strengthBar,
                  { backgroundColor: strengthColor, width: strengthWidth },
                ]}
              />
            </View>

            <View style={styles.requirements}>
              <Text style={password.length >= 8 ? styles.valid : styles.invalid}>- At least 8 characters</Text>
              <Text style={/[A-Z]/.test(password) ? styles.valid : styles.invalid}>- One uppercase letter</Text>
              <Text style={/[0-9]/.test(password) ? styles.valid : styles.invalid}>- One number</Text>
              <Text style={/[!@#$%^&*]/.test(password) ? styles.valid : styles.invalid}>- One special character</Text>
            </View>

            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="********"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.error}>Passwords do not match</Text>
            )}

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleCreateAccount}
              disabled={isSubmitting}
            >
              <Text style={styles.signupText}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <Pressable style={styles.consentRow} onPress={() => setConsentChecked((prev) => !prev)}>
              <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
                {consentChecked ? <Text style={styles.checkmark}>x</Text> : null}
              </View>
              <Text style={styles.consentText}>
                I consent to my account data being used for authentication and profile setup.
              </Text>
            </Pressable>

            <Pressable style={styles.consentRow} onPress={() => setSetupSms((prev) => !prev)}>
              <View style={[styles.checkbox, setupSms && styles.checkboxChecked]}>
                {setupSms ? <Text style={styles.checkmark}>x</Text> : null}
              </View>
              <Text style={styles.consentText}>
                Set up SMS 2-step verification after account creation.
              </Text>
            </Pressable>

            <Text style={styles.infoText}>By creating an account you agree to the Terms and Privacy Policy.</Text>
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

  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
    paddingTop: 40,
  },

  toggle: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 20,
    padding: 4,
    marginBottom: 30,
  },

  toggleActive: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
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

  ageHeaderRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ageValue: {
    color: "#d40000",
    fontSize: 14,
    fontWeight: "700",
  },

  postalHeaderRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  postalValue: {
    color: "#d40000",
    fontSize: 14,
    fontWeight: "700",
  },

  ageSlider: {
    width: "100%",
    height: 36,
    marginTop: 2,
  },

  genderRow: {
    marginTop: 8,
    gap: 8,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  optionLabel: {
    marginLeft: 10,
    color: "#333",
    fontSize: 14,
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterActive: {
    borderColor: "#d40000",
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d40000",
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

  strengthBarContainer: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 6,
    marginTop: 10,
    overflow: "hidden",
  },

  strengthBar: {
    height: 6,
    borderRadius: 6,
  },

  requirements: {
    marginTop: 10,
  },

  valid: {
    color: "#00aa55",
    fontSize: 12,
    marginTop: 3,
  },

  invalid: {
    color: "#999",
    fontSize: 12,
    marginTop: 3,
  },

  error: {
    color: "#ff4d4d",
    fontSize: 12,
    marginTop: 6,
  },

  signupButton: {
    backgroundColor: "#d40000",
    padding: 18,
    borderRadius: 16,
    marginTop: 25,
    alignItems: "center",
  },

  signupText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  consentRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxChecked: {
    borderColor: "#d40000",
    backgroundColor: "#ffeaea",
  },

  checkmark: {
    color: "#d40000",
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 14,
  },

  consentText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#5f566d",
  },

  infoText: {
    marginTop: 10,
    textAlign: "center",
    color: "#888",
    fontSize: 12,
  },
});
