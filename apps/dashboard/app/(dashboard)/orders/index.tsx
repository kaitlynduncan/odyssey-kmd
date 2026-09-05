import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Table, Column } from "@/components/primitives/Table";
import { Select } from "@/components/primitives/Select";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Drawer } from "@/components/primitives/Modal";
import { StatePanel } from "@/components/primitives/StatePanel";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { OrderStatusBadge } from "@/components/composed/OrderStatusBadge";
import { useGetApiOrders, useGetApiCustomers, useGetApiMenu } from "api-client";
import { useOrderActions } from "@/features/orders/hooks/useOrderActions";
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

const WALK_IN_VALUE = "__walk_in__";

interface CartLine {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string>(WALK_IN_VALUE);
  const [cart, setCart] = useState<CartLine[]>([]);

  const { data: response, isLoading, isError, refetch } = useGetApiOrders(
    statusFilter === "all" ? {} : { status: statusFilter as any }
  );
  const { data: customersResponse } = useGetApiCustomers();
  const { data: menuResponse } = useGetApiMenu();
  const { createOrder, isCreating } = useOrderActions();

  const orders = response?.data?.data ?? [];
  const customers = customersResponse?.data ?? [];
  const menuItems = (menuResponse?.data?.items ?? []).filter((i: any) => i.isAvailable);

  const customerOptions = [
    { label: "Walk-in (no customer)", value: WALK_IN_VALUE },
    ...customers.map((c: any) => ({ label: c.name, value: c.id })),
  ];

  const cartTotalCents = cart.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);

  function openNewOrder() {
    setCustomerId(WALK_IN_VALUE);
    setCart([]);
    setDrawerOpen(true);
  }

  function addItem(item: any) {
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) => (l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { menuItemId: item.id, name: item.name, priceCents: item.priceCents, quantity: 1 }];
    });
  }

  function changeQuantity(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  async function handleCreateOrder() {
    if (cart.length === 0) return;
    const newOrderId = await createOrder({
      customerId: customerId === WALK_IN_VALUE ? null : customerId,
      items: cart.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
    });
    setDrawerOpen(false);
    router.push(`/orders/${newOrderId}`);
  }

  const columns: Column<any>[] = [
    { key: "id", header: "Order", width: 100, render: (o) => <Text style={typography.bodyStrong}>#{o.id.slice(0, 6)}</Text> },
    { key: "customer", header: "Customer", render: (o) => <Text style={typography.body}>{o.customer?.name ?? "Walk-in"}</Text> },
    {
      key: "items",
      header: "Items",
      render: (o) => (
        <Text style={[typography.body, { color: color.textSecondary }]}>
          {o.items.reduce((s: number, i: any) => s + i.quantity, 0)} items
        </Text>
      ),
    },
    { key: "total", header: "Total", width: 100, render: (o) => <Text style={typography.body}>{formatCents(o.totalCents)}</Text> },
    { key: "status", header: "Status", width: 130, render: (o) => <OrderStatusBadge status={o.status as any} /> },
  ];

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: spacing.xl }}>
        <Text style={typography.display}>Orders</Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.lg }}>
          <View style={{ width: 220 }}>
            <Select label="Filter by status" value={statusFilter} options={STATUS_FILTER_OPTIONS as any} onChange={setStatusFilter as any} />
          </View>
          <Button label="New order" onPress={openNewOrder} />
        </View>
      </View>

      <Card padded={!isLoading && (isError || orders.length === 0)}>
        {isLoading ? (
          <SkeletonRows rows={5} />
        ) : isError ? (
          <StatePanel
            tone="error"
            title="Could not load orders"
            description="Check that the backend is running on localhost:8787."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        ) : orders.length === 0 ? (
          <StatePanel
            title="No orders match this filter"
            description="Try a different status, or create a new order."
          />
        ) : (
          <Table columns={columns} rows={orders} keyExtractor={(o) => o.id} onRowPress={(o) => router.push(`/orders/${o.id}`)} />
        )}
      </Card>

      <Drawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New order"
        footer={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setDrawerOpen(false)} />
            <Button label={`Create order · ${formatCents(cartTotalCents)}`} loading={isCreating} disabled={cart.length === 0} onPress={handleCreateOrder} />
          </>
        }
      >
        <Select label="Customer" value={customerId} options={customerOptions} onChange={setCustomerId} />

        <Text style={[typography.h3, { marginTop: spacing.md }]}>Menu</Text>
        <View style={{ maxHeight: 220, borderWidth: 1, borderColor: color.border, borderRadius: 10 }}>
          <ScrollView>
            {menuItems.map((item: any, idx: number) => (
              <Pressable
                key={item.id}
                onPress={() => addItem(item)}
                style={({ hovered }: any) => [
                  {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: spacing.md,
                    backgroundColor: hovered ? color.surfaceSunken : "transparent",
                    borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                    borderBottomColor: color.border,
                  },
                ]}
              >
                <Text style={typography.body}>{item.name}</Text>
                <Text style={[typography.body, { color: color.textSecondary }]}>{formatCents(item.priceCents)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Text style={[typography.h3, { marginTop: spacing.md }]}>Order items</Text>
        {cart.length === 0 ? (
          <Text style={[typography.body, { color: color.textMuted }]}>Tap a menu item above to add it.</Text>
        ) : (
          cart.map((line) => (
            <View key={line.menuItemId} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm }}>
              <Text style={[typography.body, { flex: 1 }]}>{line.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Pressable onPress={() => changeQuantity(line.menuItemId, -1)} style={{ padding: spacing.xs }}>
                  <Text style={typography.bodyStrong}>−</Text>
                </Pressable>
                <Text style={typography.body}>{line.quantity}</Text>
                <Pressable onPress={() => changeQuantity(line.menuItemId, 1)} style={{ padding: spacing.xs }}>
                  <Text style={typography.bodyStrong}>+</Text>
                </Pressable>
              </View>
              <Text style={[typography.body, { width: 70, textAlign: "right" }]}>{formatCents(line.priceCents * line.quantity)}</Text>
            </View>
          ))
        )}
      </Drawer>
    </ScrollView>
  );
}
