import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { color, radius, spacing, typography } from "../../theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; bgHover: string; fg: string; border?: string }> = {
  primary: { bg: color.accent, bgHover: color.accentHover, fg: color.textInverse },
  secondary: { bg: color.surface, bgHover: color.surfaceSunken, fg: color.textPrimary, border: color.border },
  ghost: { bg: "transparent", bgHover: color.surfaceSunken, fg: color.textPrimary },
  danger: { bg: color.danger, bgHover: "#8A2F24", fg: color.textInverse },
};

// Button is intentionally the primitive with the most explicit state
// handling — hover/focus/active/disabled — since every other interactive
// primitive (Select, modal actions, table row actions) is built on it.
export function Button({ label, onPress, variant = "primary", size = "md", disabled, loading, style }: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={isDisabled ? undefined : onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        size === "sm" ? styles.sm : styles.md,
        {
          backgroundColor: pressed ? v.bgHover : hovered ? v.bgHover : v.bg,
          borderColor: v.border,
          borderWidth: v.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        // Focus ring approximation for web keyboard nav
        hovered && !isDisabled ? styles.hoverRing : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <Text style={[typography.bodyStrong, { color: v.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    cursor: "pointer" as any,
  },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  hoverRing: { outlineWidth: 2, outlineColor: color.accentSubtle } as any,
});
