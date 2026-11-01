import { Button, ButtonText } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HistoryPage() {
  const { isAuthenticated, logout } = useAuthStore();
  const { top } = useSafeAreaInsets();

  const handleLogout = () => {
    if (isAuthenticated) {
      logout();
    }
  };

  return (
    <View style={{ paddingTop: top + 16, flex: 1, paddingHorizontal: 20 }}>
      <Text>
        <Button onPress={handleLogout}>
          <ButtonText>Sair</ButtonText>
        </Button>
      </Text>
    </View>
  );
}
