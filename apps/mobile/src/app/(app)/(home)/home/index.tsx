import { Pressable, View } from "react-native";
import { Link } from "expo-router";
import { PlusIcon } from "lucide-react-native";
import EntryList from "@/components/entry/entry-list";
import { useEntryStore } from "@/stores/journal-store";
import { useFeedFilterStore } from "@/stores/feed-filter-store";


export default function HomePage() {

  const entries = useEntryStore(e => e.entries)

  const query = useFeedFilterStore(f => f.query)


  return (
    <View className="flex-1 bg-zinc-50">
      <EntryList entries={entries} />
      <Link href="/(app)/(home)/home/new-post" asChild>
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
