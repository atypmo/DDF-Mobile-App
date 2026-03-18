import { StyleSheet, Text, View } from "react-native";

export default function WorkoutPartnerTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Partner</Text>
      <Text style={styles.sub}>Find and match with nearby wellness partners.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "800", color: "#16131f" },
  sub: { marginTop: 10, fontSize: 17, color: "#5f566d", lineHeight: 24 },
});
