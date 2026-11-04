import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ImageViewerModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageViewerModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerModalProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const total = images.length;

  // Sincroniza o slide inicial ao abrir
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / screenWidth);
      if (index >= 0 && index < total && index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [screenWidth, total, currentIndex]
  );

  if (!visible || total === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black relative">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* Barra superior de controle */}
        <View
          style={{ paddingTop: Math.max(top, 16) }}
          className="absolute top-0 left-0 right-0 z-30 px-4 pb-3 flex-row justify-between items-center bg-black/60"
        >
          {/* Botão fechar */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 items-center justify-center"
          >
            <X size={22} color="#FFFFFF" />
          </Pressable>

          {/* Contador de páginas */}
          {total > 1 ? (
            <View className="px-3 py-1 rounded-full bg-white/15">
              <Text className="text-white text-xs font-semibold">
                {currentIndex + 1} / {total}
              </Text>
            </View>
          ) : (
            <View className="w-10" />
          )}

          {/* Espaçador para balancear o cabeçalho */}
          <View className="w-10" />
        </View>

        {/* Lista de fotos em tela cheia (100% uncropped com contain) */}
        <FlatList
          ref={flatListRef}
          data={images}
          keyExtractor={(uri, idx) => `viewer-${uri}-${idx}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex < total ? initialIndex : 0}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 50);
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item: uri }) => (
            <View
              style={{ width: screenWidth, height: screenHeight }}
              className="justify-center items-center px-2"
            >
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
              />
            </View>
          )}
        />

        {/* Indicador de pontos inferior (se houver mais de 1 foto) */}
        {total > 1 && (
          <View
            style={{ paddingBottom: Math.max(bottom, 16) }}
            className="absolute bottom-0 left-0 right-0 z-20 flex-row justify-center items-center gap-1.5 py-3 bg-gradient-to-t from-black/80 to-transparent"
          >
            {images.map((_, idx) => (
              <View
                key={`viewer-dot-${idx}`}
                className={`rounded-full ${
                  idx === currentIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
                }`}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}
