import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card } from "@/components/primitives/Card";
import { KpiCard } from "@/components/composed/KpiCard";
import { StatePanel } from "@/components/primitives/StatePanel";
import { useMockCustomer, useMockOrders } from "@/lib/mockData";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { formatCents } from "shared/src/money";
import { color, spacing, typography } from "@/theme/tokens";

export default function CustomerDetailPage() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const { data: customer, isLoading } = useMockCustomer(customerId);
  const { data: orders } = useMockOrders();

  if (isLoading) return <Text style={typography.body}>Loading customer…</Text>;
  if (!customer) {
    return (
      <StatePanel
        title="Customer not found"
        actionLabel="Back to CRM"
        onAction={() => router.push("/crm")}
        tone="error"
      />
    );
  }

  const customerOrders = orders.filter((o) => o.customerName === customer.name);

  return (
    <ScrollView>
      <Text style={typography.display}>{customer.name}</Text>
      <Text style={[typography.body, { color: color.textSecondary, marginBottom: spacing.xl }]}>
        {customer.email} · {customer.phone}
      </Text>

      <View style={{ flexDirection: "row", gap: spacing.lg, marginBottom: spacing.xl }}>
        <KpiCard label="Orders" value={String(customer.orderCount)} />
        <KpiCard label="Total spent" value={formatCents(customer.totalSpentCents)} />
      </View>

      <Card>
        <Text style={[typography.h2, { marginBottom: spacing.lg }]}>Order history</Text>
        {customerOrders.map((order) => (
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
            <Text style={typography.body}>{formatCents(order.totalCents)}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}
