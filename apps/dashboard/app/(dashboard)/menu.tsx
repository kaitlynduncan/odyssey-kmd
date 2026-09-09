import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Card } from "@/components/primitives/Card";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { Drawer } from "@/components/primitives/Modal";
import { Input } from "@/components/primitives/Input";
import { Select } from "@/components/primitives/Select";
import { Toggle } from "@/components/primitives/Toggle";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { StatePanel } from "@/components/primitives/StatePanel";
import { useGetApiMenu } from "api-client";
import { useMenuActions } from "@/features/menu/hooks/useMenuActions";
import { sanitizePriceInput } from "@/lib/priceInput";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

const NEW_CATEGORY_VALUE = "__new__";

type EditingItem = {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  priceInput: string;
  isAvailable: boolean;
};

export default function MenuPage() {
  const { data: response, isLoading, isError, refetch } = useGetApiMenu();
  const { saveItem, createCategory, moveCategory, isSaving, isCreatingCategory, isReordering } = useMenuActions();
  const [editing, setEditing] = useState<EditingItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryNameError, setCategoryNameError] = useState<string | undefined>();
  const [itemNameError, setItemNameError] = useState<string | undefined>();

  const categories = response?.data?.categories ?? [];
  const items = response?.data?.items ?? [];

  const itemsByCategory = new Map<string, any[]>();
  items.forEach((i: any) => itemsByCategory.set(i.categoryId, [...(itemsByCategory.get(i.categoryId) ?? []), i]));

  const categoryOptions = [
    ...categories.map((c: any) => ({ label: c.name, value: c.id })),
    { label: "+ New category…", value: NEW_CATEGORY_VALUE },
  ];

  function resetErrors() {
    setCategoryNameError(undefined);
    setItemNameError(undefined);
  }

  function openCreate() {
    setNewCategoryName("");
    resetErrors();
    setEditing({ categoryId: categories[0]?.id ?? "", name: "", description: "", priceCents: 0, priceInput: "", isAvailable: true });
  }

  function openEdit(item: any) {
    setNewCategoryName("");
    resetErrors();
    setEditing({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? "",
      priceCents: item.priceCents,
      priceInput: (item.priceCents / 100).toFixed(2),
      isAvailable: item.isAvailable,
    });
  }

  async function handleSave() {
    if (!editing) return;
    resetErrors();
    const priceCents = Math.round(parseFloat(editing.priceInput || "0") * 100);

    let categoryId = editing.categoryId;
    if (categoryId === NEW_CATEGORY_VALUE) {
      if (!newCategoryName.trim()) return;
      try {
        categoryId = await createCategory(newCategoryName.trim());
      } catch (err: any) {
        // Stop here — do NOT proceed to create the item under a category
        // that failed to be created.
        setCategoryNameError(err?.message ?? "This category already exists");
        return;
      }
    }

    try {
      await saveItem({ ...editing, categoryId, priceCents });
      setEditing(null);
    } catch (err: any) {
      setItemNameError(err?.message ?? "An item with this name already exists in this category");
    }
  }

  function handleMove(categoryId: string, direction: "up" | "down") {
    moveCategory(categories, categoryId, direction);
  }

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl }}>
        <Text style={typography.display}>Menu</Text>
        <Button label="Add item" onPress={openCreate} />
      </View>

      {isLoading ? (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      ) : isError ? (
        <Card>
          <StatePanel tone="error" title="Could not load menu" description="Check that the backend is running." actionLabel="Retry" onAction={() => refetch()} />
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <StatePanel title="No menu categories yet" description="Add your first item to get started." actionLabel="Add item" onAction={openCreate} />
        </Card>
      ) : (
        categories.map((category: any, idx: number) => {
          const categoryItems = itemsByCategory.get(category.id) ?? [];
          return (
            <View key={category.id} style={{ marginBottom: spacing.xl }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md }}>
                <Text style={typography.h2}>{category.name}</Text>
                <View style={{ flexDirection: "row", gap: spacing.xs, marginLeft: spacing.sm }}>
                  <Pressable
                    onPress={() => handleMove(category.id, "up")}
                    disabled={idx === 0 || isReordering}
                    style={{ opacity: idx === 0 ? 0.3 : 1, padding: spacing.xs }}
                    accessibilityLabel={`Move ${category.name} up`}
                  >
                    <Text style={typography.bodyStrong}>↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleMove(category.id, "down")}
                    disabled={idx === categories.length - 1 || isReordering}
                    style={{ opacity: idx === categories.length - 1 ? 0.3 : 1, padding: spacing.xs }}
                    accessibilityLabel={`Move ${category.name} down`}
                  >
                    <Text style={typography.bodyStrong}>↓</Text>
                  </Pressable>
                </View>
              </View>
              <Card padded={categoryItems.length === 0}>
                {categoryItems.length === 0 ? (
                  <Text style={[typography.body, { color: color.textMuted }]}>No items in this category yet.</Text>
                ) : (
                  categoryItems.map((item: any, itemIdx: number) => (
                    <Pressable
                      key={item.id}
                      onPress={() => openEdit(item)}
                      style={({ hovered }: any) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: spacing.lg,
                          backgroundColor: hovered ? color.surfaceSunken : "transparent",
                          borderBottomWidth: itemIdx < categoryItems.length - 1 ? 1 : 0,
                          borderBottomColor: color.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={typography.bodyStrong}>{item.name}</Text>
                        <Text style={[typography.caption, { color: color.textMuted }]}>{item.description}</Text>
                      </View>
                      <Text style={[typography.body, { marginRight: spacing.xl }]}>{formatCents(item.priceCents)}</Text>
                      <Badge label={item.isAvailable ? "Available" : "Unavailable"} state={item.isAvailable ? "success" : "neutral"} />
                    </Pressable>
                  ))
                )}
              </Card>
            </View>
          );
        })
      )}

      <Drawer
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit item" : "Add item"}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} />
            <Button label="Save" loading={isSaving || isCreatingCategory} onPress={handleSave} />
          </>
        }
      >
        {editing && (
          <>
            <Select
              label="Category"
              value={editing.categoryId}
              options={categoryOptions}
              onChange={(v) => {
                setEditing({ ...editing, categoryId: v });
                setCategoryNameError(undefined);
              }}
            />
            {editing.categoryId === NEW_CATEGORY_VALUE && (
              <Input
                label="New category name"
                value={newCategoryName}
                onChangeText={(v) => {
                  setNewCategoryName(v);
                  setCategoryNameError(undefined);
                }}
                placeholder="e.g. Desserts"
                error={categoryNameError}
              />
            )}

            <Input
              label="Name"
              value={editing.name}
              onChangeText={(v) => {
                setEditing({ ...editing, name: v });
                setItemNameError(undefined);
              }}
              placeholder="e.g. Margherita Pizza"
              error={itemNameError}
            />
            <Input label="Description" value={editing.description} onChangeText={(v) => setEditing({ ...editing, description: v })} placeholder="Short description shown on the menu" />
            <Input
              label="Price (USD)"
              value={editing.priceInput}
              onChangeText={(v) => setEditing({ ...editing, priceInput: sanitizePriceInput(v) })}
              placeholder="0.00"
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={typography.bodyStrong}>Available</Text>
              <Toggle value={editing.isAvailable} onValueChange={(v) => setEditing({ ...editing, isAvailable: v })} />
            </View>
          </>
        )}
      </Drawer>
    </ScrollView>
  );
}
