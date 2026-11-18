import { useAuthStore } from "@/stores/auth-store";
import { useNoteStore } from "@/stores/note-store";
import { Redirect, Slot } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const loadInitial = useNoteStore(e => e.loadInitial)
  const notes = useNoteStore(e => e.notes)

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  useEffect(() => {
    if (notes.length === 0) {
      loadInitial(user?.id)
    }
  }, [user.id, notes.length, loadInitial])



  return (
    <Slot />
  )
}
