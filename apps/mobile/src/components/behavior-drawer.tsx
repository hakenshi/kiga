import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Bed,
  BookOpen,
  Check,
  Coffee,
  DoorClosed,
  Dumbbell,
  Flame,
  Footprints,
  Headphones,
  Heart,
  Music,
  Phone,
  Plus,
  Smartphone,
  Sparkles,
  Tv,
  Utensils,
  Wind,
  X,
} from "lucide-react-native";
import { NativeBottomSheet } from "./native-bottom-sheet";
import { EntryTextInput } from "./entry-text-input";
import {
  createBehavior,
  getBehaviorsGrouped,
  type BehaviorCategory,
  type BehaviorItem,
} from "@/lib/db/behaviors";

// Icon mapping dictionary
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

// ─── CONTEXT ─────────────────────────────────────────────────────────────

interface BehaviorDrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  userId?: number;
  selectedBehaviors: { id?: number; content: string; icon?: string | null }[];
  toggleSelectBehavior: (item: { id?: number; content: string; icon?: string | null }) => void;
  customReportText: string;
  setCustomReportText: (text: string) => void;
}

const BehaviorDrawerContext = createContext<BehaviorDrawerContextValue | null>(null);

export function useBehaviorDrawerContext() {
  const context = useContext(BehaviorDrawerContext);
  if (!context) {
    throw new Error(
      "BehaviorDrawer compound components must be rendered inside <BehaviorDrawer />"
    );
  }
  return context;
}

// ─── ROOT COMPONENT ──────────────────────────────────────────────────────

export interface BehaviorDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  userId?: number;
  selectedBehaviors: { id?: number; content: string; icon?: string | null }[];
  onToggleSelect: (item: { id?: number; content: string; icon?: string | null }) => void;
  onAddCustomBehavior?: (content: string) => void;
  children: React.ReactNode;
}

export function BehaviorDrawerRoot({
  isOpen: controlledIsOpen,
  onClose,
  userId,
  selectedBehaviors,
  onToggleSelect,
  onAddCustomBehavior,
  children,
}: BehaviorDrawerProps) {
  const isControlled = controlledIsOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = isControlled ? Boolean(controlledIsOpen) : uncontrolledOpen;

  const [customReportText, setCustomReportText] = useState("");
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [uncategorized, setUncategorized] = useState<BehaviorItem[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newBehaviorName, setNewBehaviorName] = useState("");
  const [selectedTargetCategoryId, setSelectedTargetCategoryId] = useState<number | null>(null);
  const [selectedIconId, setSelectedIconId] = useState("footprints");

  const handleClose = useCallback(() => {
    if (!isControlled) {
      setUncontrolledOpen(false);
    }
    onClose?.();
  }, [isControlled, onClose]);

  const handleOpen = useCallback(() => {
    if (!isControlled) {
      setUncontrolledOpen(true);
    }
  }, [isControlled]);

  const loadData = useCallback(async () => {
    try {
      const data = await getBehaviorsGrouped(userId);
      setCategories(data.categories);
      setUncategorized(data.uncategorized);
      if (data.categories.length > 0 && selectedTargetCategoryId === null) {
        setSelectedTargetCategoryId(data.categories[0].id);
      }
    } catch (err) {
      console.error("Error loading behavior categories:", err);
    }
  }, [userId, selectedTargetCategoryId]);

  useEffect(() => {
    if (isOpen) {
      // oxlint-disable-next-line react/set-state-in-effect
      loadData();
      setIsCreatingNew(false);
      setNewBehaviorName("");
      setSearchQuery("");
      setActiveCategoryFilter("all");
      setSelectedIconId("footprints");
    }
  }, [isOpen, loadData]);

  const handleSaveNewBehavior = async () => {
    const trimmed = newBehaviorName.trim();
    if (!trimmed) return;

    try {
      const created = await createBehavior(
        trimmed,
        selectedIconId,
        selectedTargetCategoryId,
        userId
      );

      // Refresh data
      await loadData();

      onToggleSelect({
        id: created.id,
        content: created.content,
        icon: created.icon,
      });

      setNewBehaviorName("");
      setIsCreatingNew(false);
    } catch (err) {
      console.error("Error creating behavior:", err);
    }
  };

  const handleAddCustomTextAsBehavior = () => {
    const trimmed = customReportText.trim();
    if (!trimmed) return;

    if (onAddCustomBehavior) {
      onAddCustomBehavior(trimmed);
    } else {
      onToggleSelect({ content: trimmed, icon: "sparkles" });
    }
    setCustomReportText("");
  };

  // Filtered categories according to tab filter and search
  const visibleCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return categories
      .filter((cat) => {
        if (activeCategoryFilter !== "all" && cat.id !== activeCategoryFilter) {
          return false;
        }
        return true;
      })
      .map((cat) => {
        const filteredItems = cat.items.filter((item) => {
          if (!query) return true;
          return item.content.toLowerCase().includes(query);
        });

        return {
          ...cat,
          items: filteredItems,
        };
      })
      .filter((cat) => cat.items.length > 0 || !query);
  }, [categories, activeCategoryFilter, searchQuery]);

  return (
    <BehaviorDrawerContext.Provider
      value={{
        isOpen,
        open: handleOpen,
        close: handleClose,
        userId,
        selectedBehaviors,
        toggleSelectBehavior: onToggleSelect,
        customReportText,
        setCustomReportText,
      }}
    >
      {children}

      <NativeBottomSheet isOpen={isOpen} onClose={handleClose}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>Comportamento</Text>
                <Text style={styles.subtitle}>
                  O que você fez naquela hora?
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Free Text Report Area using EntryTextInput */}
            <View style={styles.inputCard}>
              <Text style={styles.inputCardLabel}>
                Relate com suas palavras:
              </Text>
              <EntryTextInput
                value={customReportText}
                onChangeText={setCustomReportText}
                placeholder="Ex: Liguei para um amigo, fui caminhar, me isolei no quarto..."
                minHeight={80}
              />
              {customReportText.trim().length > 0 && (
                <Pressable
                  onPress={handleAddCustomTextAsBehavior}
                  style={styles.addTextChipBtn}
                >
                  <Plus size={14} color="#16181D" />
                  <Text style={styles.addTextChipLabel}>
                    Adicionar aos comportamentos
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Category Filter Tabs */}
            <View style={styles.categoryTabsSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabsContent}
              >
                <Pressable
                  onPress={() => setActiveCategoryFilter("all")}
                  style={[
                    styles.categoryTab,
                    activeCategoryFilter === "all" && styles.categoryTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      activeCategoryFilter === "all" && styles.categoryTabTextActive,
                    ]}
                  >
                    Todos
                  </Text>
                </Pressable>

                {categories.map((cat) => {
                  const isActive = activeCategoryFilter === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategoryFilter(cat.id)}
                      style={[
                        styles.categoryTab,
                        isActive && styles.categoryTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryTabText,
                          isActive && styles.categoryTabTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Grouped Behaviors by System Categories */}
            {visibleCategories.map((category) => (
              <View key={category.id} style={styles.categoryGroup}>
                <View style={styles.categoryGroupHeader}>
                  <Text style={styles.categoryGroupTitle}>
                    {category.name}
                  </Text>
                  <Text style={styles.categoryGroupCount}>
                    {category.items.length} itens
                  </Text>
                </View>

                <View style={styles.chipsContainer}>
                  {category.items.map((item) => {
                    const isSelected = selectedBehaviors.some(
                      (b) =>
                        (b.id !== undefined && b.id === item.id) ||
                        b.content.toLowerCase() === item.content.toLowerCase()
                    );
                    const IconComp = getBehaviorIcon(item.icon);

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          onToggleSelect({
                            id: item.id,
                            content: item.content,
                            icon: item.icon,
                          })
                        }
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                        ]}
                      >
                        <IconComp
                          size={15}
                          color={isSelected ? "#FFFFFF" : "#4B5563"}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {item.content}
                        </Text>
                        {isSelected && (
                          <Check size={13} color="#FFFFFF" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Uncategorized if any */}
            {uncategorized.length > 0 && (
              <View style={styles.categoryGroup}>
                <Text style={styles.categoryGroupTitle}>Outros</Text>
                <View style={styles.chipsContainer}>
                  {uncategorized.map((item) => {
                    const isSelected = selectedBehaviors.some(
                      (b) =>
                        (b.id !== undefined && b.id === item.id) ||
                        b.content.toLowerCase() === item.content.toLowerCase()
                    );
                    const IconComp = getBehaviorIcon(item.icon);

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          onToggleSelect({
                            id: item.id,
                            content: item.content,
                            icon: item.icon,
                          })
                        }
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                        ]}
                      >
                        <IconComp
                          size={15}
                          color={isSelected ? "#FFFFFF" : "#4B5563"}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {item.content}
                        </Text>
                        {isSelected && (
                          <Check size={13} color="#FFFFFF" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Inline Add New Behavior with Category and Icon Picker */}
            {isCreatingNew ? (
              <View style={styles.createBox}>
                <Text style={styles.createBoxTitle}>
                  Novo comportamento
                </Text>

                <TextInput
                  value={newBehaviorName}
                  onChangeText={setNewBehaviorName}
                  placeholder="Ex: Pratiquei meditação guiada"
                  placeholderTextColor="#9CA3AF"
                  style={styles.createInput}
                  autoFocus
                />

                {/* System Category Selector for the new behavior */}
                <Text style={styles.formSectionLabel}>
                  Vincular à categoria:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catPickScrollContent}
                >
                  {categories.map((cat) => {
                    const isCatSelected = selectedTargetCategoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedTargetCategoryId(cat.id)}
                        style={[
                          styles.catPickButton,
                          isCatSelected && styles.catPickButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPickButtonText,
                            isCatSelected && styles.catPickButtonTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Icon Selector */}
                <Text style={styles.formSectionLabel}>
                  Escolha um ícone:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconScrollContent}
                >
                  {AVAILABLE_BEHAVIOR_ICONS.map((ic) => {
                    const isIconSelected = selectedIconId === ic.id;
                    const IconComponent = ic.Icon;
                    return (
                      <Pressable
                        key={ic.id}
                        onPress={() => setSelectedIconId(ic.id)}
                        style={[
                          styles.iconPickButton,
                          isIconSelected && styles.iconPickButtonActive,
                        ]}
                      >
                        <IconComponent
                          size={18}
                          color={isIconSelected ? "#16181D" : "#6B7280"}
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.createActions}>
                  <Pressable
                    onPress={() => setIsCreatingNew(false)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveNewBehavior}
                    style={[
                      styles.saveBtn,
                      !newBehaviorName.trim() && styles.saveBtnDisabled,
                    ]}
                    disabled={!newBehaviorName.trim()}
                  >
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsCreatingNew(true)}
                style={styles.newBehaviorBtn}
              >
                <Plus size={16} color="#16181D" />
                <Text style={styles.newBehaviorBtnText}>
                  Novo comportamento personalizado
                </Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Bottom Confirmation Bar */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                if (customReportText.trim().length > 0) {
                  handleAddCustomTextAsBehavior();
                }
                handleClose();
              }}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>
                Confirmar
                {selectedBehaviors.length > 0
                  ? ` (${selectedBehaviors.length})`
                  : ""}
              </Text>
            </Pressable>
          </View>
        </View>
      </NativeBottomSheet>
    </BehaviorDrawerContext.Provider>
  );
}

// ─── COMPOUND TRIGGER ────────────────────────────────────────────────────

export function BehaviorDrawerTrigger({
  children,
}: {
  children: React.ReactElement<any>;
}) {
  const { open } = useBehaviorDrawerContext();

  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onPress?: () => void }>;
    return React.cloneElement(child, {
      onPress: () => {
        child.props.onPress?.();
        open();
      },
    });
  }

  return <Pressable onPress={open}>{children}</Pressable>;
}
BehaviorDrawerTrigger.displayName = "BehaviorDrawerTrigger";

export const BehaviorDrawer = Object.assign(BehaviorDrawerRoot, {
  Trigger: BehaviorDrawerTrigger,
});

export default BehaviorDrawer;

// ─── STYLES ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16181D",
    fontFamily: "PlusJakartaSans_700Bold",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  closeButton: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  inputCard: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  inputCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addTextChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  addTextChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16181D",
  },
  categoryTabsSection: {
    marginBottom: 16,
  },
  categoryTabsContent: {
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryTabActive: {
    backgroundColor: "#16181D",
    borderColor: "#16181D",
  },
  categoryTabText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  categoryGroup: {
    marginBottom: 18,
  },
  categoryGroupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16181D",
  },
  categoryGroupCount: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    gap: 7,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: "#16181D",
    borderColor: "#16181D",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1F2937",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  newBehaviorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  newBehaviorBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16181D",
  },
  createBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    marginTop: 8,
  },
  createBoxTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  createInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#16181D",
    marginBottom: 12,
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  catPickScrollContent: {
    gap: 6,
    paddingBottom: 12,
  },
  catPickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  catPickButtonActive: {
    borderColor: "#16181D",
    backgroundColor: "#16181D",
  },
  catPickButtonText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  catPickButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  iconScrollContent: {
    gap: 8,
    paddingBottom: 12,
  },
  iconPickButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  iconPickButtonActive: {
    borderColor: "#16181D",
    borderWidth: 2,
    backgroundColor: "#F3F4F6",
  },
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#16181D",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  confirmBtn: {
    backgroundColor: "#16181D",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
