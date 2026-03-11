import { supabase } from "@/utils/supabase";
import { Stack } from "expo-router";
import { Pressable, Text } from "react-native";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        options={{
          headerTitle: "SecondScreen",
          headerStyle: {
            backgroundColor: "#020617",
          },
          headerTitleStyle: {
            color: "white",
            fontWeight: "600",
          },
          headerTintColor: "white",
          headerRight: () => {
            return (
              <Pressable
                onPress={() => {
                  console.log("signout");
                  supabase.auth.signOut();
                }}
                style={{
                  backgroundColor: "red",
                  borderRadius: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}>
                <Text style={{ color: "white" }}>Logout</Text>
              </Pressable>
            );
          },
          headerShadowVisible: false,
        }}
        name="index"
      />
      <Stack.Screen name="[sessionCode]" />
    </Stack>
  );
}
