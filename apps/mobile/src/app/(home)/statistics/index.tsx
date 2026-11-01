import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatisticsPage() {
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: top + 16, flex: 1, paddingHorizontal: 20 }}>
      <Text>Statistics page</Text>
    </View>
  );
}
