import React, { useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Table, Column } from "@/components/primitives/Table";
import { Select } from "@/components/primitives/Select";
import { Card } from "@/components/primitives/Card";
import { StatePanel } from "@/components/primitives/StatePanel";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { useMockOrders, OrderMock } from "@/lib/mockData";
import { formatCents } from "shared/src/money";
import { typography, spacing, color } from "@/theme/tokens";

const STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
] as const;

export default function OrdersPage() {
  const router = useRouter();
  const { data: orders, isLoading } = useMockOrders();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");

  const filtered = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  const columns: Column<OrderMock>[] = [
    { key: "id", header: "Order", width: 100, render: (o) => <Text style={typography.bodyStrong}>{o.shortId}</Text> },
    { key: "customer", header: "Customer", render: (o) => <Text style={typography.body}>{o.customerName}</Text> },
    {
      key: "items",
      header: "Items",
      render: (o) => (
        <Text style={[typography.body, { color: color.textSecondary }]}>
          {o.items.reduce((s, i) => s + i.quantity, 0)} items
        </Text>
      ),
    },
    { key: "total", header: "Total", width: 100, render: (o) => <Text style={typography.body}>{formatCents(o.totalCents)}</Text> },
    { key: "status", header: "Status", width: 130, render: (o) => <OrderStatusBadge status={o.status} /> },
  ];

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: spacing.xl }}>
        <Text style={typography.display}>Orders</Text>
        <View style={{ width: 220 }}>
          <Select label="Filter by status" value={statusFilter} options={STATUS_FILTER_OPTIONS as any} onChange={setStatusFilter as any} />
        </View>
      </View>

      <Card padded={!isLoading && filtered.length === 0}>
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          <StatePanel
            title="No orders match this filter"
            description="Try a different status, or check back once new orders come in."
          />
        ) : (
          <Table columns={columns} rows={filtered} keyExtractor={(o) => o.id} onRowPress={(o) => router.push(`/orders/${o.id}`)} />
        )}
      </Card>
    </ScrollView>
  );
}
