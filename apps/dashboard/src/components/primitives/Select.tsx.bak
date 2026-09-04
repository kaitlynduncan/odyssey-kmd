import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { color, radius, spacing, typography } from "../../theme/tokens";

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

export interface SelectProps<T extends string> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

// A lightweight custom dropdown rather than the native <select> so it can
// share visual language (radius, borders, hover states) with the rest of
// the primitive set on both web and native.
export function Select<T extends string>({ label, value, options, onChange, disabled }: SelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.xs, position: "relative" as any }}>
      {label && <Text style={[typography.label, { color: color.textSecondary }]}>{label}</Text>}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen((o) => !o)}
        style={[styles.trigger, { opacity: disabled ? 0.5 : 1, borderColor: open ? color.accent : color.border }]}
      >
        <Text style={typography.body}>{selected?.label ?? "Select..."}</Text>
        <Text style={{ color: color.textMuted }}>{open ? "▲" : "▼"}</Text>
      </Pressable>
      {open && (
        <View style={styles.menu}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={({ hovered }: any) => [
                styles.menuItem,
                { backgroundColor: hovered || opt.value === value ? color.surfaceSunken : "transparent" },
              ]}
            >
              <Text style={typography.body}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: color.surface,
  },
  menu: {
    position: "absolute" as any,
    top: "100%",
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    zIndex: 20,
    overflow: "hidden",
  },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
});
