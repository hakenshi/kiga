import { Button, ButtonText } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { Text, View } from "react-native";

export default function HistoryPage() {
  const { isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    if (isAuthenticated) {
      logout();
    }
  };

  return (
    <View>
      <Text>
        <Button onPress={handleLogout}>
          <ButtonText>Sair</ButtonText>
        </Button>
      </Text>
    </View>
  );
}
