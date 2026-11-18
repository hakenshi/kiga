import { Pressable, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { PlusIcon } from "lucide-react-native";
import EntryList from "@/components/entry/entry-list";
import { selectNotes, useNoteStore } from "@/stores/note-store";
import { useFeedFilterStore } from "@/stores/feed-filter-store";
import { useAuthStore } from "@/stores/auth-store";


export default function HomePage() {

  const notes = useNoteStore(selectNotes)
  const searchNotes = useNoteStore(e => e.searchNotes)
  const query = useFeedFilterStore(f => f.query)
  const userId = useAuthStore(s => s.user!.id)

  useFocusEffect(useCallback(() => {
    searchNotes(query, { userId });
  }, [query, userId, searchNotes]));

  return (
    <View className="flex-1 bg-zinc-50">
      <EntryList notes={notes} />
      <Link href="/home/new-note" asChild>
        <Pressable
          className="absolute right-5 bottom-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg active:scale-95"
          style={{
            elevation: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
          }}
        >
          <PlusIcon size={24} color="#fafafa" strokeWidth={2.5} />
        </Pressable>
      </Link>
    </View>
  );
}
