import React, { useRef, useEffect } from "react";
import { Pressable, Animated, StyleSheet } from "react-native";
import { color, radius } from "../../theme/tokens";

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const KNOB_SIZE = 20;
const KNOB_MARGIN = 3;

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [color.borderStrong, color.accent],
  });
  const knobTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH - KNOB_SIZE - KNOB_MARGIN * 2],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      onPress={() => !disabled && onValueChange(!value)}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor as any }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: knobTranslate }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    padding: KNOB_MARGIN,
    justifyContent: "center",
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
