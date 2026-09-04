import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "@/components/primitives/Card";
import { KpiCard } from "@/components/composed/KpiCard";
import { StatePanel } from "@/components/primitives/StatePanel";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { useGetApiCustomersId } from "api-client";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function CustomerDetailPage() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const { data: response, isLoading, isError } = useGetApiCustomersId(customerId);
  const customer = response?.data;

  if (isLoading) {
    return (
      <Card>
        <SkeletonRows rows={4} />
      </Card>
    );
  }

  if (isError || !customer) {
    return (
      <StatePanel
        title="Customer not found"
        description="It may have been removed, or the backend isn't reachable."
        actionLabel="Back to CRM"
        onAction={() => router.push("/crm")}
        tone="error"
      />
    );
  }

  return (
    <ScrollView>
      <Text style={typography.display}>{customer.name}</Text>
      <Text style={[typography.body, { color: color.textSecondary, marginBottom: spacing.xl }]}>
        {customer.email ?? "No email"} · {customer.phone ?? "No phone"}
      </Text>

      <View style={{ flexDirection: "row", gap: spacing.lg, marginBottom: spacing.xl }}>
        <KpiCard label="Orders" value={String(customer.orderCount)} />
        <KpiCard label="Total spent" value={formatCents(customer.totalSpentCents)} />
      </View>

      <Card>
        <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Order history</Text>
        {customer.recentOrders.length === 0 ? (
          <Text style={[typography.body, { color: color.textMuted }]}>No orders yet.</Text>
        ) : (
                    customer.recentOrders.map((order: any) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/orders/${order.id}`)}
              style={({ hovered }: any) => [
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.sm,
                  borderRadius: 8,
                  backgroundColor: hovered ? color.surfaceSunken : "transparent",
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                },
              ]}
            >
              <Text style={typography.bodyStrong}>#{order.id.slice(0, 6)}</Text>
              <Text style={typography.body}>{formatCents(order.totalCents)}</Text>
              <OrderStatusBadge status={order.status} />
            </Pressable>
          ))
        )}
      </Card>
    </ScrollView>
  );
}
