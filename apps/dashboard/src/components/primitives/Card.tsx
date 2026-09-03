import React from "react";
import { View, ViewStyle } from "react-native";
import { color, radius, spacing, elevation } from "../../theme/tokens";

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: ViewStyle; padded?: boolean }) {
  return (
    <View
      style={[
        {
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          padding: padded ? spacing.xl : 0,
        },
        elevation.low,
        style,
      ]}
    >
      {children}
    </View>
  );
}
