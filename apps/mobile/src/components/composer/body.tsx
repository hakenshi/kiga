import { PropsWithChildren } from "react";
import { ScrollView } from "react-native";

function Body({ children }: PropsWithChildren) {
  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}
