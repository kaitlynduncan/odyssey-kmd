import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";
import { color, radius } from "../../theme/tokens";

export function Skeleton({ width, height = 16, style }: { width: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius.sm, backgroundColor: color.surfaceSunken, opacity },
        style,
      ]}
    />
  );
}

// Convenience composite for the common "a few rows of a table" loading case.
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={44} style={{ marginBottom: 8 }} />
      ))}
    </>
  );
}
