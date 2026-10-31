import { Href, Link, usePathname } from "expo-router";
import { LucideIcon } from "lucide-react-native";
import { PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";

interface Props extends PropsWithChildren {
  Icon: LucideIcon;
  path: string;
  className?: string;
  onPress?: VoidFunction;
}

export default function NavLinkButton({ Icon, onPress, path, className, children }: Props) {
  const currentPath = usePathname();
  const isActive = currentPath.includes(path);

  return (
    <Link href={path as Href} asChild>
      <Pressable
        onPress={onPress}
        className={`flex-1 items-center justify-center py-2 px-2 rounded-2xl active:opacity-70 ${isActive ? "bg-secondary" : ""
          } ${className ?? ""}`}
      >
        <View className="w-6 h-6 items-center justify-center">
          <Icon size={20} color={isActive ? "#18181b" : "#71717a"} />
        </View>
        <Text
          className={`text-[11px] mt-1 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground font-normal"
            }`}
        >
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}
