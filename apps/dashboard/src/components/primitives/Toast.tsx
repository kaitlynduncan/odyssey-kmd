import React, { createContext, useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { radius, spacing, typography, semanticState, SemanticState, elevation } from "../../theme/tokens";

interface ToastItem {
  id: string;
  message: string;
  state: SemanticState;
}

interface ToastContextValue {
  show: (message: string, state?: SemanticState) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, state: SemanticState = "neutral") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, state }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.stack} pointerEvents="box-none">
        {toasts.map((t) => {
          const s = semanticState[t.state];
          return (
            <View key={t.id} style={[styles.toast, elevation.medium, { backgroundColor: s.bg, borderColor: s.fg }]}>
              <Text style={[typography.bodyStrong, { color: s.fg }]}>{t.message}</Text>
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: "absolute" as any,
    bottom: spacing.xl,
    right: spacing.xl,
    gap: spacing.sm,
  },
  toast: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 240,
  },
});
