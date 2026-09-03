import "dotenv/config";
import { createDb } from "./client";
import { menuCategories, menuItems, customers, settings } from "./schema";
import { createOrder } from "../modules/orders/service";
import { transitionStatus } from "../modules/orders/service";

async function main() {
  const db = createDb(process.env.DATABASE_URL!);

  console.log("Seeding menu...");
  const [mains, drinks, desserts] = await db
    .insert(menuCategories)
    .values([
      { name: "Mains", sortOrder: 0 },
      { name: "Drinks", sortOrder: 1 },
      { name: "Desserts", sortOrder: 2 },
    ])
    .returning();

  const items = await db
    .insert(menuItems)
    .values([
      { categoryId: mains.id, name: "Margherita Pizza", priceCents: 1400, description: "San Marzano tomato, fior di latte, basil" },
      { categoryId: mains.id, name: "Cheeseburger", priceCents: 1600, description: "Smashed patty, aged cheddar, brioche bun" },
      { categoryId: mains.id, name: "Caesar Salad", priceCents: 1100, description: "Romaine, parmesan, anchovy dressing" },
      { categoryId: mains.id, name: "Seasonal Risotto", priceCents: 1800, isAvailable: false, description: "Ask your server for today's variant" },
      { categoryId: drinks.id, name: "House Lemonade", priceCents: 500 },
      { categoryId: drinks.id, name: "Espresso", priceCents: 350 },
      { categoryId: desserts.id, name: "Tiramisu", priceCents: 800 },
    ])
    .returning();

  console.log("Seeding customers...");
  const seededCustomers = await db
    .insert(customers)
    .values([
      { name: "Ava Thompson", email: "ava@example.com", phone: "555-0101" },
      { name: "Marcus Chen", email: "marcus@example.com", phone: "555-0102" },
      { name: "Priya Patel", email: "priya@example.com", phone: "555-0103" },
    ])
    .returning();

  console.log("Seeding settings...");
  await db.insert(settings).values({
    prepTimeMinutes: 20,
    autoAccept: false,
    isAcceptingOrders: true,
    openingHours: {
      mon: { open: "09:00", close: "21:00" },
      tue: { open: "09:00", close: "21:00" },
      wed: { open: "09:00", close: "21:00" },
      thu: { open: "09:00", close: "21:00" },
      fri: { open: "09:00", close: "22:00" },
      sat: { open: "10:00", close: "22:00" },
      sun: { open: "10:00", close: "20:00" },
    },
  });

  console.log("Seeding orders...");
  const order1 = await createOrder(db, {
    customerId: seededCustomers[0].id,
    items: [
      { menuItemId: items[0].id, quantity: 2 },
      { menuItemId: items[4].id, quantity: 2 },
    ],
  });
  await transitionStatus(db, order1.id, "accepted");
  await transitionStatus(db, order1.id, "preparing");

  const order2 = await createOrder(db, {
    customerId: seededCustomers[1].id,
    items: [{ menuItemId: items[1].id, quantity: 1 }],
  });

  const order3 = await createOrder(db, {
    customerId: seededCustomers[2].id,
    items: [{ menuItemId: items[2].id, quantity: 1 }, { menuItemId: items[6].id, quantity: 1 }],
  });
  await transitionStatus(db, order3.id, "accepted");
  await transitionStatus(db, order3.id, "preparing");
  await transitionStatus(db, order3.id, "ready");
  await transitionStatus(db, order3.id, "completed");

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
