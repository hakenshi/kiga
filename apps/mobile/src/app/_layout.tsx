import "../../global.css";

import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActivityIndicator, Text, View } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { ToastBanner } from "@/components/toast-banner";
import migrations from "../../drizzle/migrations";
import db, { expo } from "@/lib/db";
import { seedDatabase } from "@/lib/db/seed";
import { DatabaseExceptionFilter } from "@/lib/exceptions/database/filter.exception";
import { KeyboardProvider } from "react-native-keyboard-controller";

SplashScreen.preventAutoHideAsync().catch(() => { });

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    "PlusJakartaSans-Regular": PlusJakartaSans_400Regular,
    "PlusJakartaSans-Medium": PlusJakartaSans_500Medium,
    "PlusJakartaSans-SemiBold": PlusJakartaSans_600SemiBold,
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
    "PlusJakartaSans-ExtraBold": PlusJakartaSans_800ExtraBold,

    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    "Inter-ExtraBold": Inter_800ExtraBold,
  });

  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState("");

  useEffect(() => {
    if (!success) return;

    try {
      seedDatabase(expo);
      setSeeded(true);
    } catch (err) {
      setSeedError(DatabaseExceptionFilter.from(err).message);
    }
  }, [success]);

  useEffect(() => {
    async function prepare() {
      if ((fontsLoaded || fontError) && (seeded || seedError || error)) {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, [fontsLoaded, fontError, seeded, seedError, error]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Erro na migração do banco: {error.message}</Text>
      </View>
    );
  }

  if (seedError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Erro ao preparar o banco: {seedError}</Text>
      </View>
    );
  }

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!success || !seeded) {
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
          <KeyboardProvider>
            <Stack screenOptions={{ animation: "none", headerShown: false }} />
            <ToastBanner />
          </KeyboardProvider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </GestureHandlerRootView >
  );
}
