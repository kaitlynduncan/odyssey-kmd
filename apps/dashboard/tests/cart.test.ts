import { describe, it, expect } from "vitest";
import { addItemToCart, changeCartQuantity, cartTotalCents, type CartLine } from "@/features/orders/cart";

const burger = { id: "m1", name: "Burger", priceCents: 1000 };
const fries = { id: "m2", name: "Fries", priceCents: 300 };

describe("addItemToCart", () => {
  it("adds a new item with quantity 1", () => {
    expect(addItemToCart([], burger)).toEqual([{ menuItemId: "m1", name: "Burger", priceCents: 1000, quantity: 1 }]);
  });

  it("increments quantity when the item is already in the cart", () => {
    const cart = addItemToCart([{ menuItemId: "m1", name: "Burger", priceCents: 1000, quantity: 1 }], burger);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it("keeps separate lines for different items", () => {
    const cart = addItemToCart(addItemToCart([], burger), fries);
    expect(cart).toHaveLength(2);
  });
});

describe("changeCartQuantity", () => {
  const cart: CartLine[] = [{ menuItemId: "m1", name: "Burger", priceCents: 1000, quantity: 2 }];

  it("increases quantity", () => {
    expect(changeCartQuantity(cart, "m1", 1)[0].quantity).toBe(3);
  });

  it("decreases quantity", () => {
    expect(changeCartQuantity(cart, "m1", -1)[0].quantity).toBe(1);
  });

  it("removes the line entirely once quantity reaches zero", () => {
    const oneLeft: CartLine[] = [{ menuItemId: "m1", name: "Burger", priceCents: 1000, quantity: 1 }];
    expect(changeCartQuantity(oneLeft, "m1", -1)).toHaveLength(0);
  });

  it("does nothing to lines that don't match the given id", () => {
    expect(changeCartQuantity(cart, "does-not-exist", 5)).toEqual(cart);
  });
});

describe("cartTotalCents", () => {
  it("returns 0 for an empty cart", () => {
    expect(cartTotalCents([])).toBe(0);
  });

  it("sums price times quantity across all lines", () => {
    const cart: CartLine[] = [
      { menuItemId: "m1", name: "Burger", priceCents: 1000, quantity: 2 },
      { menuItemId: "m2", name: "Fries", priceCents: 300, quantity: 3 },
    ];
    expect(cartTotalCents(cart)).toBe(2 * 1000 + 3 * 300);
  });
});
