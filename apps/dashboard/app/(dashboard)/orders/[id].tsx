import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { StatePanel } from "@/components/primitives/StatePanel";
import { useMockOrder } from "@/lib/mockData";
import { useToast } from "@/components/primitives/Toast";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS, OrderStatus } from "shared/src/orderStatus";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: order, isLoading } = useMockOrder(id);

  if (isLoading) return <Text style={typography.body}>Loading order…</Text>;
  if (!order) {
    return (
      <StatePanel
        title="Order not found"
        description="It may have been removed, or the link is out of date."
        actionLabel="Back to orders"
        onAction={() => router.push("/orders")}
        tone="error"
      />
    );
  }

  // The UI only offers actions the backend's state machine actually allows —
  // it reads the same transition map the backend enforces, it doesn't
  // reimplement the rule. The backend re-validates on submit regardless.
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus];

  function handleTransition(next: OrderStatus) {
    // Swap for: usePatchOrdersIdStatus().mutate({ id: order.id, data: { status: next } })
    toast.show(`Order marked as ${ORDER_STATUS_LABELS[next].toLowerCase()}`, "success");
  }

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl }}>
        <View>
          <Text style={typography.display}>{order.shortId}</Text>
          <Text style={[typography.body, { color: color.textSecondary }]}>{order.customerName}</Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.xl }}>
        <Card style={{ flex: 2, gap: spacing.md }}>
          <Text style={typography.h2}>Items</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm }}>
              <Text style={typography.body}>
                {item.quantity} × {item.name}
              </Text>
              <Text style={typography.body}>{formatCents(item.unitPriceCentsSnapshot * item.quantity)}</Text>
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: color.border, marginTop: spacing.sm, paddingTop: spacing.md, gap: spacing.xs }}>
            <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
            <Row label="Tax" value={formatCents(order.taxCents)} />
            <Row label="Total" value={formatCents(order.totalCents)} strong />
          </View>
        </Card>

        <Card style={{ flex: 1, gap: spacing.md }}>
          <Text style={typography.h2}>Status actions</Text>
          {nextStatuses.length === 0 ? (
            <Text style={[typography.body, { color: color.textMuted }]}>This order is in a final state.</Text>
          ) : (
            nextStatuses.map((next) => (
              <Button
                key={next}
                label={`Mark as ${ORDER_STATUS_LABELS[next]}`}
                variant={next === "cancelled" ? "danger" : "primary"}
                onPress={() => handleTransition(next)}
              />
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={strong ? typography.bodyStrong : [typography.body, { color: color.textSecondary }]}>{label}</Text>
      <Text style={strong ? typography.bodyStrong : typography.body}>{value}</Text>
    </View>
  );
}
