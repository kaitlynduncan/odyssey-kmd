import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Card } from "@/components/primitives/Card";
import { Badge } from "@/components/primitives/Badge";
import { Button } from "@/components/primitives/Button";
import { Drawer } from "@/components/primitives/Modal";
import { Input } from "@/components/primitives/Input";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { useMockMenu, MenuItemMock } from "@/lib/mockData";
import { useToast } from "@/components/primitives/Toast";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function MenuPage() {
  const { data: items, isLoading } = useMockMenu();
  const [editing, setEditing] = useState<MenuItemMock | null>(null);
  const toast = useToast();

  const byCategory = new Map<string, MenuItemMock[]>();
  items.forEach((i) => byCategory.set(i.categoryName, [...(byCategory.get(i.categoryName) ?? []), i]));

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl }}>
        <Text style={typography.display}>Menu</Text>
        <Button label="Add item" onPress={() => setEditing({ id: "", categoryId: "c1", categoryName: "Mains", name: "", description: "", priceCents: 0, isAvailable: true })} />
      </View>

      {isLoading ? (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      ) : (
        [...byCategory.entries()].map(([category, categoryItems]) => (
          <View key={category} style={{ marginBottom: spacing.xl }}>
            <Text style={[typography.h2, { marginBottom: spacing.md }]}>{category}</Text>
            <Card padded={false}>
              {categoryItems.map((item, idx) => (
                <Pressable
                  key={item.id}
                  onPress={() => setEditing(item)}
                  style={({ hovered }: any) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: spacing.lg,
                      backgroundColor: hovered ? color.surfaceSunken : "transparent",
                      borderBottomWidth: idx < categoryItems.length - 1 ? 1 : 0,
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
              ))}
            </Card>
          </View>
        ))
      )}

      <Drawer
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit item" : "Add item"}
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(null)} />
            <Button
              label="Save"
              onPress={() => {
                // Swap for usePostMenuItems / usePatchMenuItemsId mutation
                toast.show(editing?.id ? "Item updated" : "Item created", "success");
                setEditing(null);
              }}
            />
          </>
        }
      >
        {editing && (
          <>
            <Input label="Name" value={editing.name} onChangeText={(v) => setEditing({ ...editing, name: v })} placeholder="e.g. Margherita Pizza" />
            <Input label="Description" value={editing.description} onChangeText={(v) => setEditing({ ...editing, description: v })} placeholder="Short description shown on the menu" />
            <Input
              label="Price (USD)"
              value={editing.priceCents ? (editing.priceCents / 100).toString() : ""}
              onChangeText={(v) => setEditing({ ...editing, priceCents: Math.round(parseFloat(v || "0") * 100) })}
              placeholder="0.00"
            />
          </>
        )}
      </Drawer>
    </ScrollView>
  );
}
