import React from "react";
import { Modal as RNModal, View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { color, radius, spacing, typography, elevation } from "../../theme/tokens";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ visible, onClose, title, children, footer }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.panel, elevation.high]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={typography.h2}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
              <Text style={{ color: color.textMuted, fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

// Drawer variant: same content contract, slides from the right instead of
// centering, for flows (order detail, item edit) that benefit from more
// vertical room without leaving full context.
export function Drawer({ visible, onClose, title, children, footer }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.drawerPanel, elevation.high]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={typography.h2}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
              <Text style={{ color: color.textMuted, fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(33,31,26,0.45)", alignItems: "center", justifyContent: "center" },
  panel: { width: 480, maxWidth: "90%", backgroundColor: color.surface, borderRadius: radius.lg, maxHeight: "85%" },
  drawerPanel: {
    width: 420,
    maxWidth: "90%",
    height: "100%",
    backgroundColor: color.surface,
    position: "absolute" as any,
    right: 0,
    top: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl, gap: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
});
