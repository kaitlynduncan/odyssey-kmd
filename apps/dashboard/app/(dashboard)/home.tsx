import React from "react";
import { View, Text, ScrollView } from "react-native";
import { KpiCard } from "@/components/composed/KpiCard";
import { Card } from "@/components/primitives/Card";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { useMockOrders } from "@/lib/mockData";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function HomePage() {
  const { data: orders, isLoading } = useMockOrders();

  const totalOrders = orders.length;
  const revenueCents = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalCents, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const itemCounts = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((i) => itemCounts.set(i.name, (itemCounts.get(i.name) ?? 0) + i.quantity)));
  const popular = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <ScrollView>
      <Text style={[typography.display, { marginBottom: spacing.xl }]}>Home</Text>

      <View style={{ flexDirection: "row", gap: spacing.lg, marginBottom: spacing.xl }}>
        <KpiCard label="Total orders" value={String(totalOrders)} loading={isLoading} />
        <KpiCard label="Revenue" value={formatCents(revenueCents)} loading={isLoading} />
        <KpiCard label="Pending orders" value={String(pendingOrders)} loading={isLoading} />
        <KpiCard label="Most popular item" value={popular?.[0] ?? "—"} loading={isLoading} />
      </View>

      <Card>
        <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Recent orders</Text>
        {orders.slice(0, 5).map((order) => (
          <View
            key={order.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <Text style={typography.bodyStrong}>{order.shortId}</Text>
            <Text style={[typography.body, { color: color.textSecondary, flex: 1, marginLeft: spacing.lg }]}>
              {order.customerName}
            </Text>
            <Text style={[typography.body, { marginRight: spacing.lg }]}>{formatCents(order.totalCents)}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
