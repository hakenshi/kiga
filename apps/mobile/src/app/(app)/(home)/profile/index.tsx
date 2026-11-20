import { ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "@/components/ui/linear-gradient";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { top } = useSafeAreaInsets();


  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: top + 16, paddingBottom: 96, paddingHorizontal: 20 }}
    >
      <VStack>
      </VStack>
    </ScrollView>
  );
}
