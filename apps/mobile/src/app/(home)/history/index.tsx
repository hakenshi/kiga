import { Button, ButtonText } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { deleteItemAsync } from "expo-secure-store";
import { Text, View } from "react-native";

export default function HistoryPage() {

  const { isAuthenticated, logout } = useAuthStore()

  const deleteSession = async () => {
    if (isAuthenticated) {
      logout()
      await deleteItemAsync("session")
    }
  }

  return (
    <View>
      <Text>
        <Button onPress={() => deleteSession()}>
          <ButtonText>
            Sair
          </ButtonText>
        </Button>
      </Text>
    </View>
  )
}
