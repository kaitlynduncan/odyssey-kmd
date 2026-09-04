import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { StatePanel } from "@/components/primitives/StatePanel";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { useGetApiOrdersId } from "api-client";
import { useOrderActions, ORDER_STATUS_LABELS } from "@/features/orders/hooks/useOrderActions";
import type { OrderStatus } from "shared/src/orderStatus";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
    const { data: response, isLoading, isError, refetch } = useGetApiOrdersId(id);
  // The generated response type is a union of the 200 and 404 shapes (Orval
  // doesn't throw on non-2xx by default). Narrowing on response.status is
  // what tells TypeScript — and us — which variant we actually got, rather
  // than assuming success and accessing fields that might not exist.
  const order = response?.status === 200 ? response.data : undefined;
  const { updateStatus, getValidNextStatuses, isPending } = useOrderActions(id);

  if (isLoading) {
    return (
      <Card>
        <SkeletonRows rows={4} />
      </Card>
    );
  }

  if (isError || !order) {
    return (
      <StatePanel
        title="Order not found"
        description="It may have been removed, or the backend isn't reachable."
        actionLabel="Back to orders"
        onAction={() => router.push("/orders")}
        tone="error"
      />
    );
  }

  const status = order.status as OrderStatus;
  const nextStatuses = getValidNextStatuses(status);

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl }}>
        <View>
          <Text style={typography.display}>#{order.id.slice(0, 6)}</Text>
          <Text style={[typography.body, { color: color.textSecondary }]}>{order.customer?.name ?? "Walk-in"}</Text>
        </View>
        <OrderStatusBadge status={status} />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.xl }}>
        <Card style={{ flex: 2, gap: spacing.md }}>
          <Text style={typography.h2}>Items</Text>
          {order.items.map((item: any, idx: number) => (
            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm }}>
              <Text style={typography.body}>
                {item.quantity} × {item.nameSnapshot}
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
                loading={isPending}
                onPress={() => updateStatus(order.id, next)}
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
