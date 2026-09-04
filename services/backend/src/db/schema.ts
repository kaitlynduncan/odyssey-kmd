import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // Always store money as integer cents. Never floats.
  priceCents: integer("price_cents").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Customers (CRM)
// ---------------------------------------------------------------------------

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: walk-in / guest orders don't require a customer record.
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  status: orderStatusEnum("status").notNull().default("pending"),
  subtotalCents: integer("subtotal_cents").notNull(),
  taxCents: integer("tax_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "restrict" }),
  // Snapshots: historical orders must not change if the menu item is edited later.
  nameSnapshot: text("name_snapshot").notNull(),
  unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
});

// Audit trail for every status change. This is what makes status transitions
// deliberate backend behavior rather than a loose client-controlled field write.
export const orderStatusEvents = pgTable("order_status_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Settings (singleton row)
// ---------------------------------------------------------------------------

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  prepTimeMinutes: integer("prep_time_minutes").notNull().default(20),
  autoAccept: boolean("auto_accept").notNull().default(false),
  isAcceptingOrders: boolean("is_accepting_orders").notNull().default(true),
  // { mon: {open: "09:00", close: "21:00"}, ... }
  openingHours: jsonb("opening_hours").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (used by Drizzle's relational query API)
// ---------------------------------------------------------------------------

export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  statusEvents: many(orderStatusEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

export const orderStatusEventsRelations = relations(orderStatusEvents, ({ one }) => ({
  order: one(orders, { fields: [orderStatusEvents.orderId], references: [orders.id] }),
}));
