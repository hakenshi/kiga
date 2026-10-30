import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Check,
  ChevronRight,
  FolderPlus,
  MoveDown,
  MoveUp,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import { NativeBottomSheet } from "./native-bottom-sheet";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import {
  createCategoryItem,
  createResourceItem,
  deleteCategoryItem,
  deleteResourceItem,
  getResourcesGrouped,
  type ResourceCategory,
  type ResourceItem,
  updateItemCategoryAndOrder,
} from "@/lib/db/resources";
import type { CategoryType } from "@/lib/db/schema";

// ─── CONTEXT ─────────────────────────────────────────────────────────────

interface ResourcePickerContextValue {
  type: CategoryType;
  selectedIds: number[];
  onToggleSelect: (id: number, name: string) => void;
  userId?: number;
  onClose: () => void;

  categories: ResourceCategory[];
  uncategorized: ResourceItem[];
  filteredCategories: ResourceCategory[];
  filteredUncategorized: ResourceItem[];

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  exactMatchExists: boolean;

  isEditing: boolean;
  setIsEditing: (e: boolean) => void;

  isAddingNew: boolean;
  setIsAddingNew: (v: boolean) => void;
  newItemName: string;
  setNewItemName: (v: string) => void;
  selectedTargetCategoryId: number | null;
  setSelectedTargetCategoryId: (id: number | null) => void;

  isAddingCategory: boolean;
  setIsAddingCategory: (v: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;

  itemToDelete: { id: number; name: string; isCategory?: boolean } | null;
  setItemToDelete: (
    item: { id: number; name: string; isCategory?: boolean } | null
  ) => void;

  handleInstantCreateFromSearch: () => Promise<void>;
  handleCreateExplicit: () => Promise<void>;
  handleCreateCategory: () => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
  handleMoveItem: (
    item: ResourceItem,
    direction: "up" | "down",
    catItems: ResourceItem[]
  ) => Promise<void>;
  handleMoveToNextCategory: (item: ResourceItem) => Promise<void>;
}

const ResourcePickerContext = createContext<ResourcePickerContextValue | null>(
  null
);

export function useResourcePickerContext() {
  const context = useContext(ResourcePickerContext);
  if (!context) {
    throw new Error(
      "ResourcePicker compound components must be rendered inside <ResourcePicker />"
    );
  }
  return context;
}

// ─── ROOT COMPONENT ──────────────────────────────────────────────────────

export interface ResourcePickerProps {
  isOpen: boolean;
  onClose: () => void;
  type: CategoryType;
  selectedIds: number[];
  onToggleSelect: (id: number, name: string) => void;
  userId?: number;
  children: React.ReactNode;
}

export function ResourcePicker({
  isOpen,
  onClose,
  type,
  selectedIds,
  onToggleSelect,
  userId,
  children,
}: ResourcePickerProps) {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [uncategorized, setUncategorized] = useState<ResourceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [selectedTargetCategoryId, setSelectedTargetCategoryId] = useState<
    number | null
  >(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    name: string;
    isCategory?: boolean;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getResourcesGrouped(type, userId);
      setCategories(data.categories);
      setUncategorized(data.uncategorized);
    } catch (err) {
      console.error("Error loading resources:", err);
    }
  }, [type, userId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSearchQuery("");
      setIsEditing(false);
      setIsAddingNew(false);
      setIsAddingCategory(false);
    }
  }, [isOpen, loadData]);

  const handleInstantCreateFromSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    try {
      const targetCatId =
        type === "thought"
          ? null
          : categories.length > 0
          ? categories[0].id
          : null;
      const created = await createResourceItem(
        type,
        trimmed,
        targetCatId,
        userId
      );

      await loadData();
      onToggleSelect(created.id, created.name);
      setSearchQuery("");
      Keyboard.dismiss();
    } catch (e) {
      console.error("Error creating resource:", e);
    }
  };

  const handleCreateExplicit = async () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;

    try {
      const created = await createResourceItem(
        type,
        trimmed,
        selectedTargetCategoryId,
        userId
      );
      await loadData();
      onToggleSelect(created.id, created.name);
      setNewItemName("");
      setIsAddingNew(false);
      Keyboard.dismiss();
    } catch (e) {
      console.error("Error creating resource:", e);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      await createCategoryItem(type, trimmed, userId);
      await loadData();
      setNewCategoryName("");
      setIsAddingCategory(false);
      Keyboard.dismiss();
    } catch (e) {
      console.error("Error creating category:", e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.isCategory) {
        await deleteCategoryItem(itemToDelete.id);
      } else {
        await deleteResourceItem(type, itemToDelete.id);
      }
      await loadData();
    } catch (e) {
      console.error("Error deleting item:", e);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleMoveItem = async (
    item: ResourceItem,
    direction: "up" | "down",
    catItems: ResourceItem[]
  ) => {
    const currentIndex = catItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= catItems.length) return;

    const otherItem = catItems[targetIndex];

    try {
      await updateItemCategoryAndOrder(
        type,
        item.id,
        item.categoryId,
        otherItem.orderIndex
      );
      await updateItemCategoryAndOrder(
        type,
        otherItem.id,
        otherItem.categoryId,
        item.orderIndex
      );
      await loadData();
    } catch (e) {
      console.error("Error reordering items:", e);
    }
  };

  const handleMoveToNextCategory = async (item: ResourceItem) => {
    if (categories.length === 0) return;
    const currentCatIdx = categories.findIndex((c) => c.id === item.categoryId);
    const nextCat =
      currentCatIdx === -1 || currentCatIdx === categories.length - 1
        ? categories[0]
        : categories[currentCatIdx + 1];

    try {
      const timestamp = new Date().getTime();
      await updateItemCategoryAndOrder(type, item.id, nextCat.id, timestamp);
      await loadData();
    } catch (e) {
      console.error("Error moving item category:", e);
    }
  };

  const { filteredCategories, filteredUncategorized, exactMatchExists } =
    useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      let match = false;

      if (!q) {
        return {
          filteredCategories: categories,
          filteredUncategorized: uncategorized,
          exactMatchExists: false,
        };
      }

      const filteredCats = categories
        .map((cat) => {
          const matchingItems = cat.items.filter((item) => {
            const itemLower = item.name.toLowerCase();
            if (itemLower === q) match = true;
            return itemLower.includes(q);
          });
          return { ...cat, items: matchingItems };
        })
        .filter((cat) => cat.items.length > 0);

      const filteredUncat = uncategorized.filter((item) => {
        const itemLower = item.name.toLowerCase();
        if (itemLower === q) match = true;
        return itemLower.includes(q);
      });

      return {
        filteredCategories: filteredCats,
        filteredUncategorized: filteredUncat,
        exactMatchExists: match,
      };
    }, [categories, uncategorized, searchQuery]);

  const contextValue: ResourcePickerContextValue = {
    type,
    selectedIds,
    onToggleSelect,
    userId,
    onClose,
    categories,
    uncategorized,
    filteredCategories,
    filteredUncategorized,
    searchQuery,
    setSearchQuery,
    exactMatchExists,
    isEditing,
    setIsEditing,
    isAddingNew,
    setIsAddingNew,
    newItemName,
    setNewItemName,
    selectedTargetCategoryId,
    setSelectedTargetCategoryId,
    isAddingCategory,
    setIsAddingCategory,
    newCategoryName,
    setNewCategoryName,
    itemToDelete,
    setItemToDelete,
    handleInstantCreateFromSearch,
    handleCreateExplicit,
    handleCreateCategory,
    handleConfirmDelete,
    handleMoveItem,
    handleMoveToNextCategory,
  };

  return (
    <ResourcePickerContext.Provider value={contextValue}>
      <NativeBottomSheet isOpen={isOpen} onClose={onClose}>
        {children}
        <ResourcePickerDeleteDialog />
      </NativeBottomSheet>
    </ResourcePickerContext.Provider>
  );
}

// ─── COMPOUND: HEADER ────────────────────────────────────────────────────

export interface ResourcePickerHeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function ResourcePickerHeader({
  title,
  children,
}: ResourcePickerHeaderProps) {
  const { isEditing, setIsEditing, onClose } = useResourcePickerContext();

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleContainer}>
          {children ? (
            children
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
          {isEditing && (
            <View style={styles.editingBadge}>
              <Text style={styles.editingBadgeText}>Editando</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {isEditing ? (
            <Pressable
              onPress={() => setIsEditing(false)}
              style={styles.doneEditButton}
            >
              <Text style={styles.doneEditText}>Concluir</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#16181D" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── COMPOUND: SEARCH ────────────────────────────────────────────────────

export interface ResourcePickerSearchProps {
  placeholder?: string;
}

export function ResourcePickerSearch({
  placeholder = "Buscar ou criar...",
}: ResourcePickerSearchProps) {
  const {
    searchQuery,
    setSearchQuery,
    exactMatchExists,
    handleInstantCreateFromSearch,
  } = useResourcePickerContext();

  return (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (!exactMatchExists && searchQuery.trim()) {
              handleInstantCreateFromSearch();
            }
          }}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery("")}
            hitSlop={8}
            style={styles.clearSearch}
          >
            <X size={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── COMPOUND: CONTENT (LIST & CHIPS) ────────────────────────────────────

export interface ResourcePickerContentProps {
  addLabel?: string;
}

export function ResourcePickerContent({
  addLabel = "Novo item",
}: ResourcePickerContentProps) {
  const {
    type,
    selectedIds,
    onToggleSelect,
    categories,
    filteredCategories,
    filteredUncategorized,
    searchQuery,
    exactMatchExists,
    handleInstantCreateFromSearch,
    isEditing,
    setIsEditing,
    isAddingNew,
    setIsAddingNew,
    newItemName,
    setNewItemName,
    setSelectedTargetCategoryId,
    isAddingCategory,
    setIsAddingCategory,
    newCategoryName,
    setNewCategoryName,
    setItemToDelete,
    handleCreateExplicit,
    handleCreateCategory,
    handleMoveItem,
    handleMoveToNextCategory,
  } = useResourcePickerContext();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Zero-friction Creation Card when searching without exact match */}
      {searchQuery.trim().length > 0 && !exactMatchExists && (
        <View style={styles.searchCreationSection}>
          <Text style={styles.noMatchText}>
            Nenhum resultado exato encontrado.
          </Text>
          <Pressable
            onPress={handleInstantCreateFromSearch}
            style={styles.createSearchCard}
          >
            <View style={styles.createSearchLeft}>
              <View style={styles.createSearchIconCircle}>
                <Plus size={18} color="#16181D" />
              </View>
              <View style={styles.createSearchTextGroup}>
                <Text style={styles.createSearchTitle}>
                  Criar "{searchQuery.trim()}"
                </Text>
                <Text style={styles.createSearchSubtitle}>
                  Adicionar e selecionar imediatamente
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      )}

      {/* Inline Add Resource Input */}
      {isAddingNew && (
        <View style={styles.inlineAddContainer}>
          <Text style={styles.inlineAddTitle}>Novo registro</Text>
          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Nome do registro..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            style={styles.inlineInput}
          />
          <View style={styles.inlineAddActions}>
            <Pressable
              onPress={() => {
                setIsAddingNew(false);
                setNewItemName("");
              }}
              style={styles.inlineCancelBtn}
            >
              <Text style={styles.inlineCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateExplicit}
              style={styles.inlineSubmitBtn}
            >
              <Text style={styles.inlineSubmitText}>Criar e Selecionar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Inline Add Category Input */}
      {isAddingCategory && (
        <View style={styles.inlineAddContainer}>
          <Text style={styles.inlineAddTitle}>Nova categoria</Text>
          <TextInput
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="Ex: No trabalho, Relacionamento..."
            placeholderTextColor="#9CA3AF"
            autoFocus
            style={styles.inlineInput}
          />
          <View style={styles.inlineAddActions}>
            <Pressable
              onPress={() => {
                setIsAddingCategory(false);
                setNewCategoryName("");
              }}
              style={styles.inlineCancelBtn}
            >
              <Text style={styles.inlineCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateCategory}
              style={styles.inlineSubmitBtn}
            >
              <Text style={styles.inlineSubmitText}>Criar Categoria</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Categories */}
      {filteredCategories.map((category) => (
        <View key={category.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{category.name}</Text>
            {category.userId !== null && (
              <Text style={styles.sectionHint}>Criada por você</Text>
            )}
            {isEditing && (
              <Pressable
                onPress={() =>
                  setItemToDelete({
                    id: category.id,
                    name: category.name,
                    isCategory: true,
                  })
                }
                hitSlop={8}
                style={styles.deleteCategoryBtn}
              >
                <Trash2 size={16} color="#EF4444" />
              </Pressable>
            )}
          </View>

          <View style={styles.chipsContainer}>
            {category.items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (isEditing) {
                      setItemToDelete({
                        id: item.id,
                        name: item.name,
                        isCategory: false,
                      });
                    } else {
                      onToggleSelect(item.id, item.name);
                    }
                  }}
                  onLongPress={() => setIsEditing(true)}
                  delayLongPress={400}
                  style={[
                    styles.chip,
                    isSelected && !isEditing ? styles.chipSelected : null,
                    isEditing ? styles.chipEditing : null,
                  ]}
                >
                  {isSelected && !isEditing && (
                    <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  {isEditing && (
                    <Trash2 size={14} color="#EF4444" strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && !isEditing ? styles.chipTextSelected : null,
                      isEditing ? styles.chipTextEditing : null,
                    ]}
                  >
                    {item.name}
                  </Text>

                  {isEditing && (
                    <View style={styles.chipReorderControls}>
                      <Pressable
                        onPress={() =>
                          handleMoveItem(item, "up", category.items)
                        }
                        hitSlop={4}
                        style={styles.miniMoveBtn}
                      >
                        <MoveUp size={11} color="#6B7280" />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          handleMoveItem(item, "down", category.items)
                        }
                        hitSlop={4}
                        style={styles.miniMoveBtn}
                      >
                        <MoveDown size={11} color="#6B7280" />
                      </Pressable>
                      {categories.length > 1 && (
                        <Pressable
                          onPress={() => handleMoveToNextCategory(item)}
                          hitSlop={4}
                          style={styles.miniMoveBtn}
                        >
                          <FolderPlus size={11} color="#4F46E5" />
                        </Pressable>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Uncategorized items */}
      {filteredUncategorized.length > 0 && (
        <View style={styles.section}>
          {type !== "thought" && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sem categoria</Text>
            </View>
          )}
          <View style={styles.chipsContainer}>
            {filteredUncategorized.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (isEditing) {
                      setItemToDelete({
                        id: item.id,
                        name: item.name,
                        isCategory: false,
                      });
                    } else {
                      onToggleSelect(item.id, item.name);
                    }
                  }}
                  onLongPress={() => setIsEditing(true)}
                  delayLongPress={400}
                  style={[
                    styles.chip,
                    isSelected && !isEditing ? styles.chipSelected : null,
                    isEditing ? styles.chipEditing : null,
                  ]}
                >
                  {isSelected && !isEditing && (
                    <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                  {isEditing && (
                    <Trash2 size={14} color="#EF4444" strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && !isEditing ? styles.chipTextSelected : null,
                      isEditing ? styles.chipTextEditing : null,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Footer Action Buttons */}
      <View style={styles.footerRowActions}>
        <Pressable
          onPress={() => {
            setIsAddingNew(true);
            setSelectedTargetCategoryId(
              type === "thought"
                ? null
                : categories.length > 0
                ? categories[0].id
                : null
            );
          }}
          style={styles.addItemActionBtn}
        >
          <Plus size={16} color="#16181D" />
          <Text style={styles.addItemActionText}>{addLabel}</Text>
        </Pressable>

        {type !== "thought" && (
          <Pressable
            onPress={() => setIsAddingCategory(true)}
            style={styles.addCategoryActionBtn}
          >
            <FolderPlus size={16} color="#4B5563" />
            <Text style={styles.addCategoryActionText}>Nova Categoria</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

// ─── COMPOUND: FOOTER ────────────────────────────────────────────────────

export interface ResourcePickerFooterProps {
  children: React.ReactNode;
}

export function ResourcePickerFooter({ children }: ResourcePickerFooterProps) {
  return <View style={styles.bottomBar}>{children}</View>;
}

// ─── INTERNAL: DELETE DIALOG ─────────────────────────────────────────────

function ResourcePickerDeleteDialog() {
  const { itemToDelete, setItemToDelete, handleConfirmDelete } =
    useResourcePickerContext();

  return (
    <AlertDialog
      isOpen={itemToDelete !== null}
      onClose={() => setItemToDelete(null)}
      size="md"
    >
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text className="text-lg font-bold text-[#16181D]">
            Excluir {itemToDelete?.isCategory ? "categoria" : "item"}?
          </Text>
          <AlertDialogCloseButton>
            <X size={18} color="#6B7280" />
          </AlertDialogCloseButton>
        </AlertDialogHeader>

        <AlertDialogBody>
          <Text className="text-sm text-gray-600 leading-relaxed">
            Tem certeza que deseja excluir "{itemToDelete?.name}"? Essa ação não
            pode ser desfeita.
          </Text>
        </AlertDialogBody>

        <AlertDialogFooter>
          <Button
            variant="outline"
            className="rounded-xl px-4"
            onPress={() => setItemToDelete(null)}
          >
            <ButtonText className="text-gray-700">Cancelar</ButtonText>
          </Button>
          <Button
            className="rounded-xl bg-red-600 px-4"
            onPress={handleConfirmDelete}
          >
            <ButtonText className="text-white font-semibold">Excluir</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── ATTACH COMPOUND COMPONENTS ──────────────────────────────────────────

ResourcePicker.Header = ResourcePickerHeader;
ResourcePicker.Search = ResourcePickerSearch;
ResourcePicker.Content = ResourcePickerContent;
ResourcePicker.Footer = ResourcePickerFooter;

// ─── STYLES ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16181D",
  },
  editingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  editingBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  doneEditButton: {
    backgroundColor: "#16181D",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  doneEditText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#16181D",
    paddingVertical: 0,
  },
  clearSearch: {
    padding: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchCreationSection: {
    marginBottom: 16,
  },
  noMatchText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  createSearchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
  },
  createSearchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  createSearchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  createSearchTextGroup: {
    flex: 1,
  },
  createSearchTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16181D",
  },
  createSearchSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  inlineAddContainer: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  inlineAddTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inlineInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#16181D",
    marginBottom: 10,
  },
  inlineAddActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  inlineCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  inlineCancelText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  inlineSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#16181D",
  },
  inlineSubmitText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16181D",
  },
  sectionHint: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  deleteCategoryBtn: {
    marginLeft: "auto",
    padding: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: "#16181D",
    borderColor: "#16181D",
  },
  chipEditing: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
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
  chipTextEditing: {
    color: "#DC2626",
  },
  chipReorderControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: "#FCA5A5",
    paddingLeft: 4,
  },
  miniMoveBtn: {
    padding: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  footerRowActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  addItemActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },
  addItemActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16181D",
  },
  addCategoryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },
  addCategoryActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
});
