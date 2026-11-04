import { useToastStore } from "@/stores/toast-store";
import { AlertCircle, Info, X } from "lucide-react-native";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ToastBanner = memo(function ToastBanner() {
  const currentToast = useToastStore((s) => s.currentToast);
  const dismiss = useToastStore((s) => s.dismiss);
  const { top } = useSafeAreaInsets();

  if (!currentToast) return null;

  const isError = currentToast.type === "error";
  const isAction = currentToast.type === "action";

  return (
    <View
      pointerEvents="box-none"
      style={{ top: Math.max(top + 8, 16) }}
      className="absolute left-4 right-4 z-50 items-center"
    >
      <View
        className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl px-4 py-3.5 shadow-2xl flex-row items-center justify-between gap-3"
        style={{
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
        }}
      >
        {/* Ícone de status */}
        <View className="shrink-0">
          {isError ? (
            <AlertCircle size={18} color="#EF4444" />
          ) : (
            <Info size={18} color="#A1A1AA" />
          )}
        </View>

        {/* Mensagem simples e direta */}
        <Text className="text-white text-[13px] font-heading leading-tight flex-1">
          {currentToast.message}
        </Text>

        {/* Botão de ação (ex: Desfazer) */}
        {isAction && currentToast.onAction && currentToast.actionLabel && (
          <Pressable
            onPress={() => {
              currentToast.onAction?.();
              dismiss();
            }}
            hitSlop={8}
            className="px-3 py-1.5 rounded-full bg-white active:bg-zinc-200"
          >
            <Text className="text-black text-xs font-heading">
              {currentToast.actionLabel}
            </Text>
          </Pressable>
        )}

        {/* Botão fechar */}
        <Pressable
          onPress={dismiss}
          hitSlop={8}
          className="w-6 h-6 rounded-full items-center justify-center active:bg-white/10"
        >
          <X size={14} color="#71717A" />
        </Pressable>
      </View>
    </View>
  );
});
