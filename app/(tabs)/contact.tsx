import { StyleSheet, Text, View } from "react-native";

export default function ContactTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact</Text>
      <Text style={styles.sub}>Get in touch with our team and support channels.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "800", color: "#16131f" },
  sub: { marginTop: 10, fontSize: 17, color: "#5f566d", lineHeight: 24 },
});
