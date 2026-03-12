import { supabase } from "@/utils/supabase";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const [isAuth, setIsAuth] = useState<boolean>(false);

  useEffect(() => {
    // get initial session
    supabase.auth.getSession().then(({ data }) => {
      setIsAuth(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setIsAuth(true);
        if (_event === "SIGNED_OUT") setIsAuth(false);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // prevent flicker while checking auth
  if (isAuth === null) return null;

  return (
    <>
      <StatusBar style="light" animated />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuth}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={isAuth}>
          <Stack.Screen name="(root)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
