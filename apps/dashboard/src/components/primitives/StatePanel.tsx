import React from "react";
import { View, Text } from "react-native";
import { color, spacing, typography } from "../../theme/tokens";
import { Button } from "./Button";

interface StatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "empty" | "error";
}

// Single shared implementation for empty and error states so every list
// page (Orders, Menu, CRM) presents them identically rather than each
// screen inventing its own copy and layout.
export function StatePanel({ title, description, actionLabel, onAction, tone = "empty" }: StatePanelProps) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxxl, gap: spacing.sm }}>
      <Text style={[typography.h3, { color: tone === "error" ? color.danger : color.textPrimary }]}>{title}</Text>
      {description && (
        <Text style={[typography.body, { color: color.textSecondary, textAlign: "center", maxWidth: 360 }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: spacing.md }}>
          <Button label={actionLabel} onPress={onAction} variant={tone === "error" ? "secondary" : "primary"} />
        </View>
      )}
    </View>
  );
}
