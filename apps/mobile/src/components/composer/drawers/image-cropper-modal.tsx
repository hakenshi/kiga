import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import {
  Check,
  Maximize2,
  RotateCw,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AspectPreset = "free" | "original" | "1:1" | "4:5" | "16:9";
type DragMode =
  | "NONE"
  | "CENTER"
  | "TL"
  | "TR"
  | "BL"
  | "BR"
  | "T"
  | "B"
  | "L"
  | "R";

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageCropperModalProps {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onComplete: (newUri: string) => void;
}

const MIN_CROP_SIZE = 56;
const CORNER_HIT_RADIUS = 44;
const EDGE_HIT_DISTANCE = 28;

const ASPECT_PRESETS: {
  id: AspectPreset;
  label: string;
  ratio: number | null;
}[] = [
  { id: "free", label: "Livre", ratio: null },
  { id: "original", label: "Original", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

export default function ImageCropperModal({
  visible,
  uri,
  onClose,
  onComplete,
}: ImageCropperModalProps) {
  const { top, bottom } = useSafeAreaInsets();
  const [workingUri, setWorkingUri] = useState<string | null>(null);
  const [prevInputUri, setPrevInputUri] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [preset, setPreset] = useState<AspectPreset>("free");
  const [isProcessing, setIsProcessing] = useState(false);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });

  const dragSessionRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startCrop: CropBox;
  }>({
    mode: "NONE",
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, w: 0, h: 0 },
  });

  if (uri !== prevInputUri) {
    setPrevInputUri(uri);
    setWorkingUri(uri);
    setPreset("free");
  }

  const activeUri = workingUri ?? uri;

  // Compute displayed image dimensions inside stage (leaving padding for corner handles)
  const availW = Math.max(0, stageSize.width - 40);
  const availH = Math.max(0, stageSize.height - 40);
  const imgAspect =
    naturalSize.height > 0 ? naturalSize.width / naturalSize.height : 1;

  let dispW = availW;
  let dispH = imgAspect > 0 ? availW / imgAspect : availH;
  if (dispH > availH && availH > 0) {
    dispH = availH;
    dispW = availH * imgAspect;
  }

  const resetCropToFull = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      setCrop({ x: 0, y: 0, w, h });
    }
  };

  const applyAspectPreset = (
    targetPreset: AspectPreset,
    w = dispW,
    h = dispH
  ) => {
    setPreset(targetPreset);
    if (w <= 0 || h <= 0) return;

    if (targetPreset === "free" || targetPreset === "original") {
      setCrop({ x: 0, y: 0, w, h });
      return;
    }

    const found = ASPECT_PRESETS.find((p) => p.id === targetPreset);
    const ratio = found?.ratio;
    if (!ratio) return;

    let boxW = w;
    let boxH = boxW / ratio;
    if (boxH > h) {
      boxH = h;
      boxW = boxH * ratio;
    }

    setCrop({
      x: (w - boxW) / 2,
      y: (h - boxH) / 2,
      w: boxW,
      h: boxH,
    });
  };

  const clamp = (val: number, min: number, max: number) =>
    Math.min(max, Math.max(min, val));

  const detectDragMode = (lx: number, ly: number, c: CropBox): DragMode => {
    const dist = (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x1 - x2, y1 - y2);

    if (dist(lx, ly, c.x, c.y) <= CORNER_HIT_RADIUS) return "TL";
    if (dist(lx, ly, c.x + c.w, c.y) <= CORNER_HIT_RADIUS) return "TR";
    if (dist(lx, ly, c.x, c.y + c.h) <= CORNER_HIT_RADIUS) return "BL";
    if (dist(lx, ly, c.x + c.w, c.y + c.h) <= CORNER_HIT_RADIUS) return "BR";

    const inX = lx >= c.x - EDGE_HIT_DISTANCE && lx <= c.x + c.w + EDGE_HIT_DISTANCE;
    const inY = ly >= c.y - EDGE_HIT_DISTANCE && ly <= c.y + c.h + EDGE_HIT_DISTANCE;

    if (inX && Math.abs(ly - c.y) <= EDGE_HIT_DISTANCE) return "T";
    if (inX && Math.abs(ly - (c.y + c.h)) <= EDGE_HIT_DISTANCE) return "B";
    if (inY && Math.abs(lx - c.x) <= EDGE_HIT_DISTANCE) return "L";
    if (inY && Math.abs(lx - (c.x + c.w)) <= EDGE_HIT_DISTANCE) return "R";

    if (lx >= c.x && lx <= c.x + c.w && ly >= c.y && ly <= c.y + c.h) {
      return "CENTER";
    }

    return "NONE";
  };

  const handleResponderGrant = (e: GestureResponderEvent) => {
    const lx = e.nativeEvent.locationX;
    const ly = e.nativeEvent.locationY;
    const mode = detectDragMode(lx, ly, crop);

    dragSessionRef.current = {
      mode,
      startX: e.nativeEvent.pageX,
      startY: e.nativeEvent.pageY,
      startCrop: { ...crop },
    };
  };

  const handleResponderMove = (e: GestureResponderEvent) => {
    const { mode, startX, startY, startCrop: s } = dragSessionRef.current;
    if (mode === "NONE") return;

    const dx = e.nativeEvent.pageX - startX;
    const dy = e.nativeEvent.pageY - startY;

    if (mode === "CENTER") {
      const nextX = clamp(s.x + dx, 0, Math.max(0, dispW - s.w));
      const nextY = clamp(s.y + dy, 0, Math.max(0, dispH - s.h));
      setCrop({ x: nextX, y: nextY, w: s.w, h: s.h });
      return;
    }

    let nextX = s.x;
    let nextY = s.y;
    let nextW = s.w;
    let nextH = s.h;

    if (mode === "TL" || mode === "L" || mode === "BL") {
      nextX = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP_SIZE);
      nextW = s.w - (nextX - s.x);
    }
    if (mode === "TR" || mode === "R" || mode === "BR") {
      nextW = clamp(s.w + dx, MIN_CROP_SIZE, dispW - s.x);
    }
    if (mode === "TL" || mode === "T" || mode === "TR") {
      nextY = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP_SIZE);
      nextH = s.h - (nextY - s.y);
    }
    if (mode === "BL" || mode === "B" || mode === "BR") {
      nextH = clamp(s.h + dy, MIN_CROP_SIZE, dispH - s.y);
    }

    setCrop({ x: nextX, y: nextY, w: nextW, h: nextH });
  };

  const handleRotate = async () => {
    if (!activeUri || isProcessing) return;
    setIsProcessing(true);
    try {
      const rotated = await ImageManipulator.manipulateAsync(
        activeUri,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      setWorkingUri(rotated.uri);
      setNaturalSize({ width: rotated.width, height: rotated.height });
      setPreset("free");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!activeUri || isProcessing) return;

    const isFullCrop =
      dispW > 0 &&
      dispH > 0 &&
      Math.abs(crop.x) < 2 &&
      Math.abs(crop.y) < 2 &&
      Math.abs(crop.w - dispW) < 2 &&
      Math.abs(crop.h - dispH) < 2;

    if (isFullCrop) {
      onComplete(activeUri);
      return;
    }

    setIsProcessing(true);
    try {
      const scaleX = naturalSize.width / dispW;
      const scaleY = naturalSize.height / dispH;

      const originX = clamp(
        Math.round(crop.x * scaleX),
        0,
        Math.max(0, naturalSize.width - 1)
      );
      const originY = clamp(
        Math.round(crop.y * scaleY),
        0,
        Math.max(0, naturalSize.height - 1)
      );
      const width = clamp(
        Math.round(crop.w * scaleX),
        1,
        naturalSize.width - originX
      );
      const height = clamp(
        Math.round(crop.h * scaleY),
        1,
        naturalSize.height - originY
      );

      const cropped = await ImageManipulator.manipulateAsync(
        activeUri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      onComplete(cropped.uri);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!activeUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <VStack
        className="flex-1 bg-white"
        style={{ paddingTop: top + 8, paddingBottom: bottom + 12 }}
      >
        {/* Top Studio Bar */}
        <HStack className="px-4 py-2.5 items-center justify-between border-b border-[#E6E8EC]">
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="w-10 h-10 rounded-full bg-[#F2F3F5] items-center justify-center active:opacity-75"
          >
            <X size={18} color="#16181D" />
          </Pressable>

          <VStack className="items-center">
            <Text className="text-[16px] font-heading text-[#16181D]">
              Ajustar imagem
            </Text>
            <Text className="text-[11px] font-subtitle text-[#5A606B]">
              Arraste os cantos ou bordas para recortar
            </Text>
          </VStack>

          <Pressable
            onPress={handleConfirm}
            disabled={isProcessing}
            className="h-10 px-4 rounded-full bg-[#16181D] flex-row items-center justify-center gap-1.5 active:opacity-85"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={16} color="#FFFFFF" />
                <Text className="text-[13px] font-heading text-white">
                  Aplicar
                </Text>
              </>
            )}
          </Pressable>
        </HStack>

        {/* Interactive Crop Stage */}
        <View
          className="flex-1 items-center justify-center bg-[#F4F4F5]"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setStageSize({ width, height });
          }}
        >
          {dispW > 0 && dispH > 0 && (
            <View
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={handleResponderGrant}
              onResponderMove={handleResponderMove}
              style={{
                width: dispW,
                height: dispH,
                backgroundColor: "#FFFFFF",
              }}
              className="relative"
            >
              <Image
                source={{ uri: activeUri }}
                style={{ width: dispW, height: dispH }}
                contentFit="contain"
                onLoad={(e) => {
                  const nw = e.source.width || 1;
                  const nh = e.source.height || 1;
                  setNaturalSize({ width: nw, height: nh });

                  const ratio = nw / nh;
                  let w = availW;
                  let h = w / ratio;
                  if (h > availH && availH > 0) {
                    h = availH;
                    w = h * ratio;
                  }
                  resetCropToFull(w, h);
                }}
              />

              {/* Outside Scrim Masks (Top, Bottom, Left, Right) */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: dispW,
                  height: crop.y,
                  backgroundColor: "rgba(22, 24, 29, 0.52)",
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: crop.y + crop.h,
                  left: 0,
                  width: dispW,
                  height: Math.max(0, dispH - (crop.y + crop.h)),
                  backgroundColor: "rgba(22, 24, 29, 0.52)",
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: crop.y,
                  left: 0,
                  width: crop.x,
                  height: crop.h,
                  backgroundColor: "rgba(22, 24, 29, 0.52)",
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: crop.y,
                  left: crop.x + crop.w,
                  width: Math.max(0, dispW - (crop.x + crop.w)),
                  height: crop.h,
                  backgroundColor: "rgba(22, 24, 29, 0.52)",
                }}
              />

              {/* Active Crop Box with Rule-of-Thirds Grid (pointerEvents="none" so parent handles all touches cleanly) */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: crop.x,
                  top: crop.y,
                  width: crop.w,
                  height: crop.h,
                  borderWidth: 2,
                  borderColor: "#16181D",
                }}
              >
                {/* Vertical Thirds */}
                <View
                  style={{
                    position: "absolute",
                    left: "33.33%",
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: "rgba(22, 24, 29, 0.25)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: "66.66%",
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: "rgba(22, 24, 29, 0.25)",
                  }}
                />
                {/* Horizontal Thirds */}
                <View
                  style={{
                    position: "absolute",
                    top: "33.33%",
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: "rgba(22, 24, 29, 0.25)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: "66.66%",
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: "rgba(22, 24, 29, 0.25)",
                  }}
                />

                {/* Corner Handles */}
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    left: -3,
                    width: 22,
                    height: 22,
                    borderTopWidth: 4,
                    borderLeftWidth: 4,
                    borderColor: "#16181D",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    width: 22,
                    height: 22,
                    borderTopWidth: 4,
                    borderRightWidth: 4,
                    borderColor: "#16181D",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: -3,
                    width: 22,
                    height: 22,
                    borderBottomWidth: 4,
                    borderLeftWidth: 4,
                    borderColor: "#16181D",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    bottom: -3,
                    right: -3,
                    width: 22,
                    height: 22,
                    borderBottomWidth: 4,
                    borderRightWidth: 4,
                    borderColor: "#16181D",
                  }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Bottom Studio Controls */}
        <VStack
          space="md"
          className="px-5 pt-3 bg-white border-t border-[#E6E8EC]"
        >
          {/* Quick Actions: Rotate & Reset */}
          <HStack className="justify-center items-center gap-3">
            <Pressable
              onPress={handleRotate}
              disabled={isProcessing}
              className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-[#F2F3F5] border border-[#E6E8EC] active:opacity-75"
            >
              <RotateCw size={15} color="#16181D" />
              <Text className="text-xs font-medium text-[#16181D]">
                Girar 90°
              </Text>
            </Pressable>

            <Pressable
              onPress={() => applyAspectPreset("original")}
              disabled={isProcessing}
              className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-[#F2F3F5] border border-[#E6E8EC] active:opacity-75"
            >
              <Maximize2 size={15} color="#5A606B" />
              <Text className="text-xs font-medium text-[#5A606B]">
                Inteira
              </Text>
            </Pressable>
          </HStack>

          {/* Aspect Ratio Preset Pills */}
          <HStack className="justify-between items-center bg-[#F2F3F5] p-1.5 rounded-2xl border border-[#E6E8EC]">
            {ASPECT_PRESETS.map((item) => {
              const isSelected = preset === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => applyAspectPreset(item.id)}
                  className={`flex-1 py-2 rounded-xl items-center justify-center flex-row gap-1 ${
                    isSelected ? "bg-[#16181D]" : "bg-transparent"
                  }`}
                >
                  {item.id === "free" ? (
                    <SlidersHorizontal
                      size={12}
                      color={isSelected ? "#FFFFFF" : "#5A606B"}
                    />
                  ) : item.id === "1:1" ? (
                    <Square
                      size={12}
                      color={isSelected ? "#FFFFFF" : "#5A606B"}
                    />
                  ) : null}
                  <Text
                    className={`text-xs ${
                      isSelected
                        ? "font-heading text-white"
                        : "font-subtitle-medium text-[#5A606B]"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>
      </VStack>
    </Modal>
  );
}
