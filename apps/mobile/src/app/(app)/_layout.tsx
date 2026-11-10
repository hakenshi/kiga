import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Slot } from "expo-router";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Slot />
  )
}
