import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { KpiCard } from "@/components/composed/KpiCard";
import { Card } from "@/components/primitives/Card";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { StatePanel } from "@/components/primitives/StatePanel";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { useGetApiOrders } from "api-client";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function HomePage() {
  const router = useRouter();
  const { data: response, isLoading, isError, refetch } = useGetApiOrders({});
  const orders = response?.data?.data ?? [];

  const totalOrders = orders.length;
  const revenueCents = orders.filter((o: any) => o.status === "completed").reduce((s: number, o: any) => s + o.totalCents, 0);
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const itemCounts = new Map<string, number>();
  orders.forEach((o: any) => o.items.forEach((i: any) => itemCounts.set(i.nameSnapshot, (itemCounts.get(i.nameSnapshot) ?? 0) + i.quantity)));
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

      <Card padded={!isLoading && (isError || orders.length === 0)}>
        <Text style={[typography.h2, { marginBottom: spacing.lg, paddingHorizontal: isLoading || isError || orders.length === 0 ? 0 : spacing.xl, paddingTop: isLoading || isError || orders.length === 0 ? 0 : spacing.xl }]}>
          Recent orders
        </Text>
        {isLoading ? (
          <SkeletonRows rows={4} />
        ) : isError ? (
          <StatePanel tone="error" title="Could not load orders" description="Check that the backend is running." actionLabel="Retry" onAction={() => refetch()} />
        ) : orders.length === 0 ? (
          <StatePanel title="No orders yet" description="Orders will show up here once customers start ordering." />
        ) : (
          orders.slice(0, 5).map((order: any) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/orders/${order.id}`)}
              style={({ hovered }: any) => [
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xl,
                  backgroundColor: hovered ? color.surfaceSunken : "transparent",
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                },
              ]}
            >
              <Text style={typography.bodyStrong}>#{order.id.slice(0, 6)}</Text>
              <Text style={[typography.body, { color: color.textSecondary, flex: 1, marginLeft: spacing.lg }]}>
                {order.customer?.name ?? "Walk-in"}
              </Text>
              <Text style={[typography.body, { marginRight: spacing.lg }]}>{formatCents(order.totalCents)}</Text>
              <OrderStatusBadge status={order.status} />
            </Pressable>
          ))
        )}
      </Card>
    </ScrollView>
  );
}
