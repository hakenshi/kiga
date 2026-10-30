import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NativeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function NativeBottomSheet({
  isOpen,
  children,
}: NativeBottomSheetProps) {
  const insets = useSafeAreaInsets();

  if (!isOpen) {
    return null;
  }

  return (
    <Animated.View
      entering={SlideInDown.duration(260)}
      exiting={SlideOutDown.duration(200)}
      style={[
        StyleSheet.absoluteFill,
        styles.fullscreenContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    backgroundColor: "#FFFFFF",
    zIndex: 100,
  },
  content: {
    flex: 1,
  },
});
