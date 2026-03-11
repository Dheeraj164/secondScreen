import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";

export default function Session() {
  const localParam = useLocalSearchParams();
  console.log(localParam);
  return (
    <View style={styles.mainContainer}>
      <Text>{localParam.sessionCode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
});
