import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, Text, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect } from "react";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import migrations from "../../drizzle/migrations";
import db from "../lib/db";
import "../../global.css";
import { getItem } from "expo-secure-store";
import { useAuthStore } from "@/stores/auth-store";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const { setUser } = useAuthStore();

  useEffect(() => {
    try {
      const sessionString = getItem("session");
      if (sessionString) {
        const parsed = JSON.parse(sessionString);
        if (parsed?.isAuthenticated) {
          const user = (parsed.user ?? parsed) as User;
          setUser({ user, isAuthenticated: true });
        }
      }
    } catch (e) {
      console.error("Erro ao recuperar sessão:", e);
    }
  }, [setUser]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Erro na migração do banco: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider mode="system">
          <Stack screenOptions={{ headerShown: false }} />
        </GluestackUIProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
