import { Image } from "expo-image";
import { Crop, X } from "lucide-react-native";
import { memo, useCallback, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { ImageViewerModal } from "./image-viewer-modal";

interface ImageCarouselProps {
  images: string[];
  /** Proporção fixa opcional. Por padrão usa 1:1 (quadrado) para carrossel e natural para foto única. */
  aspectRatio?: number;
  onRemove?: (uri: string, index: number) => void;
  onEdit?: (uri: string, index: number) => void;
  className?: string;
}

export const ImageCarousel = memo(function ImageCarousel({
  images,
  aspectRatio: customRatio,
  onRemove,
  onEdit,
  className = "",
}: ImageCarouselProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [singleImageRatio, setSingleImageRatio] = useState<number>(1);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  const total = images.length;
  const isComposerMode = Boolean(onRemove || onEdit);

  // Proporção do card: 1:1 para carrossel (estilo Instagram) e adaptativa para foto única
  const carouselRatio = customRatio ?? (total === 1 ? singleImageRatio : 1);

  const openViewer = useCallback((index: number) => {
    setViewerInitialIndex(index);
    setViewerVisible(true);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerWidth <= 0) return;
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / containerWidth);
      if (index >= 0 && index < total && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [containerWidth, total, activeIndex]
  );

  if (total === 0) return null;

  return (
    <>
      {/* Imagem única */}
      {total === 1 ? (
        <View
          onLayout={(e) => {
            const w = Math.floor(e.nativeEvent.layout.width);
            if (w > 0 && w !== containerWidth) setContainerWidth(w);
          }}
          className={`w-full rounded-2xl overflow-hidden bg-[#16181D] relative ${className}`}
          style={{ aspectRatio: carouselRatio }}
        >
          <Pressable
            onPress={() => openViewer(0)}
            className="w-full h-full justify-center items-center active:opacity-95"
          >
            <Image
              source={{ uri: images[0] }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              onLoad={(e) => {
                if (e.source.width && e.source.height) {
                  const r = e.source.width / e.source.height;
                  // Limita proporção da foto única entre 4:5 e 16:9
                  setSingleImageRatio(Math.max(0.8, Math.min(1.77, r)));
                }
              }}
            />
          </Pressable>

          {/* Borda decorativa sobreposta */}
          <View
            pointerEvents="none"
            className="absolute inset-0 rounded-2xl border border-[#E6E8EC]/80"
          />

          {isComposerMode && onRemove && (
            <Pressable
              onPress={() => onRemove(images[0], 0)}
              hitSlop={8}
              style={{ backgroundColor: "rgba(22, 24, 29, 0.85)" }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full items-center justify-center active:opacity-80 z-10"
            >
              <X size={15} color="#FFFFFF" />
            </Pressable>
          )}

          {isComposerMode && onEdit && (
            <Pressable
              onPress={() => onEdit(images[0], 0)}
              hitSlop={8}
              style={{ backgroundColor: "rgba(22, 24, 29, 0.85)" }}
              className="absolute bottom-2.5 right-2.5 h-7 px-3 rounded-full flex-row items-center justify-center gap-1.5 active:opacity-80 z-10"
            >
              <Crop size={13} color="#FFFFFF" />
              <Text className="text-[11px] font-heading text-white">Recortar</Text>
            </Pressable>
          )}
        </View>
      ) : (
        /* Múltiplas imagens (Carrossel com clique para tela cheia) */
        <View className={`w-full gap-2 ${className}`}>
          <View
            onLayout={(e) => {
              const w = Math.floor(e.nativeEvent.layout.width);
              if (w > 0 && w !== containerWidth) setContainerWidth(w);
            }}
            className="w-full rounded-2xl overflow-hidden bg-[#16181D] relative"
            style={{ aspectRatio: carouselRatio }}
          >
            {containerWidth > 0 && (
              <FlatList
                data={images}
                keyExtractor={(uri, i) => `${uri}-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                bounces={false}
                decelerationRate="fast"
                snapToInterval={containerWidth}
                snapToAlignment="start"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={(_, index) => ({
                  length: containerWidth,
                  offset: containerWidth * index,
                  index,
                })}
                renderItem={({ item: uri, index }) => (
                  <View
                    style={{ width: containerWidth, height: "100%", overflow: "hidden" }}
                    className="relative bg-[#16181D]"
                  >
                    <Pressable
                      onPress={() => openViewer(index)}
                      className="w-full h-full active:opacity-95"
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </Pressable>

                    {/* Controles de edição por slide no Composer */}
                    {isComposerMode && onRemove && (
                      <Pressable
                        onPress={() => onRemove(uri, index)}
                        hitSlop={8}
                        style={{ backgroundColor: "rgba(22, 24, 29, 0.85)" }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full items-center justify-center active:opacity-80 z-10"
                      >
                        <X size={15} color="#FFFFFF" />
                      </Pressable>
                    )}

                    {isComposerMode && onEdit && (
                      <Pressable
                        onPress={() => onEdit(uri, index)}
                        hitSlop={8}
                        style={{ backgroundColor: "rgba(22, 24, 29, 0.85)" }}
                        className="absolute bottom-2.5 right-2.5 h-7 px-3 rounded-full flex-row items-center justify-center gap-1.5 active:opacity-80 z-10"
                      >
                        <Crop size={13} color="#FFFFFF" />
                        <Text className="text-[11px] font-heading text-white">Recortar</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              />
            )}

            {/* Borda decorativa sobreposta sem vazar fotos vizinhas */}
            <View
              pointerEvents="none"
              className="absolute inset-0 rounded-2xl border border-[#E6E8EC]/80"
            />

            {/* Badge numérica de slide */}
            <View
              style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
              className={`absolute ${
                isComposerMode ? "top-2.5 left-2.5" : "top-2.5 right-2.5"
              } px-2.5 py-1 rounded-full z-10 pointer-events-none`}
            >
              <Text className="text-[11px] font-heading text-white">
                {isComposerMode
                  ? `Foto ${activeIndex + 1} de ${total}`
                  : `${activeIndex + 1} / ${total}`}
              </Text>
            </View>
          </View>

          {/* Dots de paginação centralizados */}
          <View className="flex-row items-center justify-center gap-1.5 py-1">
            {images.map((_, i) => {
              const isActive = i === activeIndex;
              return (
                <View
                  key={`dot-${i}`}
                  className={`rounded-full ${
                    isActive ? "w-4 h-1.5 bg-[#18181B]" : "w-1.5 h-1.5 bg-[#D4D4D8]"
                  }`}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Modal de Tela Cheia (Exibe a imagem 100% inteira sem cortes) */}
      <ImageViewerModal
        visible={viewerVisible}
        images={images}
        initialIndex={viewerInitialIndex}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
});
