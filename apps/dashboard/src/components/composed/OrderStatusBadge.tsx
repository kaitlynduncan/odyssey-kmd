import React from "react";
import { Badge } from "../primitives/Badge";
import type { SemanticState } from "../../theme/tokens";

// The status union itself is never redeclared here — it's imported from the
// generated api-client types (see packages/api-client). This file only maps
// each known status to presentation.
type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled";

const STATUS_CONFIG: Record<OrderStatus, { label: string; state: SemanticState }> = {
  pending: { label: "Pending", state: "neutral" },
  accepted: { label: "Accepted", state: "info" },
  preparing: { label: "Preparing", state: "warning" },
  ready: { label: "Ready", state: "success" },
  completed: { label: "Completed", state: "success" },
  cancelled: { label: "Cancelled", state: "danger" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge label={cfg.label} state={cfg.state} />;
}
