import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { radius, spacing, typography, semanticState, SemanticState } from "../../theme/tokens";

export function Badge({ label, state = "neutral" }: { label: string; state?: SemanticState }) {
  const s = semanticState[state];
  return (
    <View style={[styles.base, { backgroundColor: s.bg }]}>
      <Text style={[typography.label, { color: s.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
