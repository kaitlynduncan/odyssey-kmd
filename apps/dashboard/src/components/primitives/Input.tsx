import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { color, radius, spacing, typography } from "../../theme/tokens";

export interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
}

export function Input({ label, value, onChangeText, placeholder, error, helpText, disabled, secureTextEntry }: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text style={[typography.label, { color: color.textSecondary }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={color.textMuted}
        style={[
          styles.input,
          typography.body,
          {
            borderColor: error ? color.danger : focused ? color.accent : color.border,
            backgroundColor: disabled ? color.surfaceSunken : color.surface,
            color: color.textPrimary,
          },
        ]}
      />
      {error ? (
        <Text style={[typography.caption, { color: color.danger }]}>{error}</Text>
      ) : helpText ? (
        <Text style={[typography.caption, { color: color.textMuted }]}>{helpText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
