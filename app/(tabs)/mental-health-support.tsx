import { StyleSheet, Text, View } from "react-native";

export default function MentalHealthSupportTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mental Health Support</Text>
      <Text style={styles.sub}>Daily check-in, coping tools, and support resources.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "800", color: "#16131f" },
  sub: { marginTop: 10, fontSize: 17, color: "#5f566d", lineHeight: 24 },
});
