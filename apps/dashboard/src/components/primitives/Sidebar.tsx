import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { color, radius, spacing, typography } from "../../theme/tokens";

export interface NavItem {
  key: string;
  label: string;
  href: string;
}

export function Sidebar({ items, activeKey, onNavigate }: { items: NavItem[]; activeKey: string; onNavigate: (href: string) => void }) {
  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { marginBottom: spacing.xl }]}>Odyssey</Text>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onNavigate(item.href)}
            style={({ hovered }: any) => [
              styles.item,
              { backgroundColor: active ? color.accentSubtle : hovered ? color.surfaceSunken : "transparent" },
            ]}
          >
            <Text style={[typography.bodyStrong, { color: active ? color.accent : color.textSecondary }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, padding: spacing.lg, borderRightWidth: 1, borderRightColor: color.border },
  item: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.xs },
});
