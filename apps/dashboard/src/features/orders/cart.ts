// Pure cart logic for the new-order drawer, extracted out of the page
// component so it's testable in isolation and the page stays thin.
export interface CartLine {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export interface CartMenuItem {
  id: string;
  name: string;
  priceCents: number;
}

// Adds one unit of the given item, incrementing quantity if it's already in
// the cart rather than creating a duplicate line.
export function addItemToCart(cart: CartLine[], item: CartMenuItem): CartLine[] {
  const existing = cart.find((l) => l.menuItemId === item.id);
  if (existing) {
    return cart.map((l) => (l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
  }
  return [...cart, { menuItemId: item.id, name: item.name, priceCents: item.priceCents, quantity: 1 }];
}

// Adjusts a line's quantity by delta, removing the line once quantity
// reaches zero rather than leaving a zero-quantity row in the cart.
export function changeCartQuantity(cart: CartLine[], menuItemId: string, delta: number): CartLine[] {
  return cart
    .map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: l.quantity + delta } : l))
    .filter((l) => l.quantity > 0);
}

export function cartTotalCents(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
}
