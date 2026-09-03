import { describe, it, expect } from "vitest";
import { ORDER_STATUS_TRANSITIONS } from "shared/src/orderStatus";

describe("order status actions available in the UI", () => {
  it("only offers transitions the shared state machine allows", () => {
    expect(ORDER_STATUS_TRANSITIONS.pending).toEqual(["accepted", "cancelled"]);
  });

  it("offers no actions once an order reaches a terminal state", () => {
    expect(ORDER_STATUS_TRANSITIONS.completed).toHaveLength(0);
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
  });
});
