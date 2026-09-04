import React from "react";
import { Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Table, Column } from "@/components/primitives/Table";
import { Card } from "@/components/primitives/Card";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { StatePanel } from "@/components/primitives/StatePanel";
import { useGetApiCustomers } from "api-client";
import { formatCents } from "shared/src/money";
import { typography, spacing, color } from "@/theme/tokens";

export default function CrmPage() {
  const router = useRouter();
  const { data: response, isLoading, isError, refetch } = useGetApiCustomers();
  const customers = response?.data ?? [];

  const columns: Column<any>[] = [
    { key: "name", header: "Customer", render: (c) => <Text style={typography.bodyStrong}>{c.name}</Text> },
    { key: "email", header: "Email", render: (c) => <Text style={[typography.body, { color: color.textSecondary }]}>{c.email ?? "—"}</Text> },
    { key: "orders", header: "Orders", width: 90, render: (c) => <Text style={typography.body}>{c.orderCount}</Text> },
    { key: "spend", header: "Total spent", width: 120, render: (c) => <Text style={typography.body}>{formatCents(c.totalSpentCents)}</Text> },
  ];

  return (
    <ScrollView>
      <Text style={[typography.display, { marginBottom: spacing.xl }]}>CRM</Text>
      <Card padded={!isLoading && (isError || customers.length === 0)}>
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : isError ? (
          <StatePanel tone="error" title="Could not load customers" description="Check that the backend is running." actionLabel="Retry" onAction={() => refetch()} />
        ) : customers.length === 0 ? (
          <StatePanel title="No customers yet" description="Customers will appear here once they place an order." />
        ) : (
          <Table columns={columns} rows={customers} keyExtractor={(c) => c.id} onRowPress={(c) => router.push(`/crm/${c.id}`)} />
        )}
      </Card>
    </ScrollView>
  );
}
