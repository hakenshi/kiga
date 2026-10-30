
import { FlatList } from "react-native-gesture-handler";
import EntryBody from "./_components/entry/entry-body";
import EntryBottom from "./_components/entry/entry-bottom";
import EntryHeader from "./_components/entry/entry-header";
import EntryShell from "./_components/entry/entry-shell";

export default function HomePage() {
  const DUMMY_DATA = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }))

  return (
    <FlatList
      data={DUMMY_DATA}
      keyExtractor={(item) => item.id}
      contentContainerClassName="pb-20" showsHorizontalScrollIndicator={true}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      showsVerticalScrollIndicator={false}
      renderItem={() => (
        <EntryShell>
          <EntryHeader />
          <EntryBody />
          <EntryBottom />
        </EntryShell>

      )}
    >
    </FlatList>
  )
}
