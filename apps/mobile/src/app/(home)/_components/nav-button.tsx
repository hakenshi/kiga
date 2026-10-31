import { usePathname } from "expo-router";
import { LucideIcon } from "lucide-react-native";
import { PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";

interface Props extends PropsWithChildren {
  Icon: LucideIcon;
  path?: string;
  className?: string;
  onPress?: VoidFunction;
  badge?: number;
}

export default function NavButton({ Icon, onPress, path, className, children, badge }: Props) {
  const currentPath = usePathname();
  const isActive = path ? currentPath.includes(path) : false;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center py-2 px-2 rounded-2xl active:opacity-70 ${isActive ? "bg-secondary" : ""
        } ${className ?? ""}`}
    >
      <View className="w-6 h-6 items-center justify-center relative">
        <Icon size={20} color={isActive ? "#18181b" : "#71717a"} />
        {badge !== undefined && badge > 0 && (
          <View className="absolute -top-1.5 -right-2 bg-primary min-w-[16px] h-4 px-1 rounded-full items-center justify-center">
            <Text className="text-[10px] text-primary-foreground font-bold leading-none">
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        className={`text-[11px] mt-1 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground font-normal"
          }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
