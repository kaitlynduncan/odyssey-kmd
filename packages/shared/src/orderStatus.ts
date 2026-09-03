// Single definition of the order status state machine. The backend service
// enforces it; the frontend imports it only to decide which status actions
// to *show* (e.g. disable "Mark ready" from "pending"). The backend is still
// the enforcement authority — this shared copy exists so the two never drift,
// not so the frontend can bypass the backend check.

export const ORDER_STATUSES = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};
