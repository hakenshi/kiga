import { Text } from "@/components/ui/text";
import { usePathname } from "expo-router";
import { LucideIcon } from "lucide-react-native";
import { PropsWithChildren } from "react";
import { Pressable, View } from "react-native";

interface Props extends PropsWithChildren {
  Icon: LucideIcon;
  path?: string;
  className?: string;
  onPress?: VoidFunction;
  badge?: number;
}

export default function NavButton({
  Icon,
  onPress,
  path,
  className,
  children,
  badge,
}: Props) {
  const currentPath = usePathname();
  const isActive = path ? currentPath.includes(path) : false;
  const hasBadge = badge !== undefined && badge > 0;
  const isHighlighted = isActive || hasBadge;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center py-2 px-1 rounded-2xl active:opacity-70 ${
        isActive ? "bg-secondary" : ""
      } ${className ?? ""}`}
    >
      <View className="w-7 h-6 items-center justify-center relative">
        <Icon
          size={20}
          color={isHighlighted ? "#16181D" : "#71717A"}
          strokeWidth={isHighlighted ? 2.1 : 1.8}
        />
        {hasBadge && (
          <View
            style={{
              position: "absolute",
              top: -5,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#16181D",
              borderWidth: 1.5,
              borderColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                lineHeight: 12,
                color: "#FFFFFF",
                includeFontPadding: false,
                textAlign: "center",
              }}
              className="font-heading"
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        className={`text-[11px] mt-1 text-center w-full ${
          isHighlighted
            ? "text-[#16181D] font-subtitle-semibold"
            : "text-[#71717A] font-subtitle"
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
