import React from "react";
import {
  Bed,
  BookOpen,
  Coffee,
  DoorClosed,
  Dumbbell,
  Flame,
  Footprints,
  Headphones,
  Heart,
  Music,
  Phone,
  Smartphone,
  Sparkles,
  Tv,
  Utensils,
  Wind,
} from "lucide-react-native";

export const BEHAVIOR_ICON_MAP: Record<string, React.ComponentType<any>> = {
  footprints: Footprints,
  phone: Phone,
  coffee: Coffee,
  wind: Wind,
  bed: Bed,
  smartphone: Smartphone,
  "book-open": BookOpen,
  utensils: Utensils,
  music: Music,
  heart: Heart,
  flame: Flame,
  dumbbell: Dumbbell,
  tv: Tv,
  "door-closed": DoorClosed,
  sparkles: Sparkles,
  headphones: Headphones,
};

export const AVAILABLE_BEHAVIOR_ICONS = [
  { id: "footprints", label: "Caminhar", Icon: Footprints },
  { id: "phone", label: "Ligar", Icon: Phone },
  { id: "coffee", label: "Café", Icon: Coffee },
  { id: "wind", label: "Respirar", Icon: Wind },
  { id: "bed", label: "Descanso", Icon: Bed },
  { id: "smartphone", label: "Celular", Icon: Smartphone },
  { id: "book-open", label: "Ler", Icon: BookOpen },
  { id: "utensils", label: "Comer", Icon: Utensils },
  { id: "music", label: "Música", Icon: Music },
  { id: "heart", label: "Cuidado", Icon: Heart },
  { id: "flame", label: "Exercício", Icon: Flame },
  { id: "dumbbell", label: "Treino", Icon: Dumbbell },
  { id: "tv", label: "TV", Icon: Tv },
  { id: "door-closed", label: "Isolar", Icon: DoorClosed },
  { id: "sparkles", label: "Geral", Icon: Sparkles },
  { id: "headphones", label: "Áudio", Icon: Headphones },
];

export function getBehaviorIcon(iconName?: string | null): React.ComponentType<any> {
  if (!iconName) return Footprints;
  return BEHAVIOR_ICON_MAP[iconName] || Footprints;
}
