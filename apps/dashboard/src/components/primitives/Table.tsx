import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { color, spacing, typography } from "../../theme/tokens";

export interface Column<T> {
  key: string;
  header: string;
  width?: number | `${number}%`;
  render: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowPress?: (row: T) => void;
}

export function Table<T>({ columns, rows, keyExtractor, onRowPress }: TableProps<T>) {
  return (
    <View>
      <View style={[styles.row, styles.headerRow]}>
        {columns.map((col) => (
          <View key={col.key} style={{ width: col.width ?? undefined, flex: col.width ? undefined : 1 }}>
            <Text style={[typography.label, { color: color.textMuted }]}>{col.header}</Text>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <Pressable
          key={keyExtractor(row)}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
          style={({ hovered }: any) => [
            styles.row,
            { backgroundColor: hovered && onRowPress ? color.surfaceSunken : "transparent" },
          ]}
        >
          {columns.map((col) => (
            <View key={col.key} style={{ width: col.width ?? undefined, flex: col.width ? undefined : 1 }}>
              {col.render(row)}
            </View>
          ))}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    gap: spacing.md,
  },
  headerRow: { borderBottomColor: color.borderStrong },
});
