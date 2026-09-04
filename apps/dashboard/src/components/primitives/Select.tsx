import React, { useRef, useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet, findNodeHandle, UIManager } from "react-native";
import { color, radius, spacing, typography, elevation } from "../../theme/tokens";

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

export function Select<T extends string>({ label, value, options, onChange, disabled }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);
  const selected = options.find((o) => o.value === value);

  function handleOpen() {
    const node = findNodeHandle(triggerRef.current);
    if (node) {
      UIManager.measureInWindow(node, (x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text style={[typography.label, { color: color.textSecondary }]}>{label}</Text>}
      <Pressable
        ref={triggerRef}
        disabled={disabled}
        onPress={handleOpen}
        style={[styles.trigger, { opacity: disabled ? 0.5 : 1, borderColor: open ? color.accent : color.border }]}
      >
        <Text style={typography.body}>{selected?.label ?? "Select..."}</Text>
        <Text style={{ color: color.textMuted }}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              elevation.medium,
              { position: "absolute", top: anchor.y + anchor.height + 4, left: anchor.x, width: anchor.width },
            ]}
          >
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
        </Pressable>
      </Modal>
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
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    overflow: "hidden",
  },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
});
