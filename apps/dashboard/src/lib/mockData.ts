// TEMPORARY. Every export here has the exact shape the real generated hook
// will return (see services/backend/src/modules/*/schemas.ts). Once you've
// run `pnpm dev:backend` + `pnpm seed` + `pnpm gen:contract`, replace each
// `useMock*` call in the pages with the matching generated hook from
// "api-client" — the component code below doesn't need to change shape,
// only the import and the loading/error branches (React Query gives you
// those for free; this mock fakes a delay so the skeleton states are visible).
import { useEffect, useState } from "react";
import type { OrderStatus } from "shared/src/orderStatus";

export interface MenuItemMock {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  priceCents: number;
  isAvailable: boolean;
}

export interface OrderMock {
  id: string;
  shortId: string;
  customerName: string;
  status: OrderStatus;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
  items: { name: string; quantity: number; unitPriceCentsSnapshot: number }[];
}

export interface CustomerMock {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpentCents: number;
}

const MENU: MenuItemMock[] = [
  { id: "m1", categoryId: "c1", categoryName: "Mains", name: "Margherita Pizza", description: "San Marzano tomato, fior di latte, basil", priceCents: 1400, isAvailable: true },
  { id: "m2", categoryId: "c1", categoryName: "Mains", name: "Cheeseburger", description: "Smashed patty, aged cheddar, brioche bun", priceCents: 1600, isAvailable: true },
  { id: "m3", categoryId: "c1", categoryName: "Mains", name: "Caesar Salad", description: "Romaine, parmesan, anchovy dressing", priceCents: 1100, isAvailable: true },
  { id: "m4", categoryId: "c1", categoryName: "Mains", name: "Seasonal Risotto", description: "Ask your server for today's variant", priceCents: 1800, isAvailable: false },
  { id: "m5", categoryId: "c2", categoryName: "Drinks", name: "House Lemonade", description: "Fresh squeezed, mint", priceCents: 500, isAvailable: true },
  { id: "m6", categoryId: "c2", categoryName: "Drinks", name: "Espresso", description: "Double shot", priceCents: 350, isAvailable: true },
  { id: "m7", categoryId: "c3", categoryName: "Desserts", name: "Tiramisu", description: "Espresso-soaked ladyfingers, mascarpone", priceCents: 800, isAvailable: true },
];

const ORDERS: OrderMock[] = [
  {
    id: "o1", shortId: "#1024", customerName: "Ava Thompson", status: "preparing",
    subtotalCents: 3800, taxCents: 314, totalCents: 4114, createdAt: "2026-09-02T14:20:00Z",
    items: [{ name: "Margherita Pizza", quantity: 2, unitPriceCentsSnapshot: 1400 }, { name: "House Lemonade", quantity: 2, unitPriceCentsSnapshot: 500 }],
  },
  {
    id: "o2", shortId: "#1025", customerName: "Marcus Chen", status: "pending",
    subtotalCents: 1600, taxCents: 132, totalCents: 1732, createdAt: "2026-09-02T14:35:00Z",
    items: [{ name: "Cheeseburger", quantity: 1, unitPriceCentsSnapshot: 1600 }],
  },
  {
    id: "o3", shortId: "#1023", customerName: "Priya Patel", status: "completed",
    subtotalCents: 1900, taxCents: 157, totalCents: 2057, createdAt: "2026-09-02T13:05:00Z",
    items: [{ name: "Caesar Salad", quantity: 1, unitPriceCentsSnapshot: 1100 }, { name: "Tiramisu", quantity: 1, unitPriceCentsSnapshot: 800 }],
  },
  {
    id: "o4", shortId: "#1026", customerName: "Ava Thompson", status: "cancelled",
    subtotalCents: 1400, taxCents: 116, totalCents: 1516, createdAt: "2026-09-02T12:10:00Z",
    items: [{ name: "Margherita Pizza", quantity: 1, unitPriceCentsSnapshot: 1400 }],
  },
];

const CUSTOMERS: CustomerMock[] = [
  { id: "cu1", name: "Ava Thompson", email: "ava@example.com", phone: "555-0101", orderCount: 2, totalSpentCents: 5630 },
  { id: "cu2", name: "Marcus Chen", email: "marcus@example.com", phone: "555-0102", orderCount: 1, totalSpentCents: 1732 },
  { id: "cu3", name: "Priya Patel", email: "priya@example.com", phone: "555-0103", orderCount: 1, totalSpentCents: 2057 },
];

function useDelayed<T>(value: T, ms = 500) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, []);
  return { data: value, isLoading: loading };
}

export function useMockMenu() {
  return useDelayed(MENU);
}
export function useMockOrders() {
  return useDelayed(ORDERS);
}
export function useMockCustomers() {
  return useDelayed(CUSTOMERS);
}
export function useMockOrder(id: string) {
  return useDelayed(ORDERS.find((o) => o.id === id) ?? null);
}
export function useMockCustomer(id: string) {
  return useDelayed(CUSTOMERS.find((c) => c.id === id) ?? null);
}
