import { useQueryClient } from "@tanstack/react-query";
import {
  usePatchApiOrdersIdStatus,
  usePostApiOrders,
  getGetApiOrdersQueryKey,
  getGetApiOrdersIdQueryKey,
} from "api-client";
import { useToast } from "../../../components/primitives/Toast";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS, type OrderStatus } from "shared/src/orderStatus";

// Same gotcha as useMenuActions: Orval's fetch client resolves (never
// rejects) for any completed HTTP response, so mutateAsync() does NOT throw
// just because the server returned 409/422. Every call site here checks the
// resolved status explicitly.
function unwrapOrThrow<T>(result: { status: number; data: any }, expectedStatus: number): T {
  if (result.status !== expectedStatus) {
    throw new Error(result.data?.error?.message ?? "Something went wrong");
  }
  return result.data as T;
}

export function useOrderActions(orderId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidateOrders = () => queryClient.invalidateQueries({ queryKey: getGetApiOrdersQueryKey() });

  const statusMutation = usePatchApiOrdersIdStatus();
  const createMutation = usePostApiOrders();

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const result = await statusMutation.mutateAsync({ id, data: { status } });
      unwrapOrThrow(result as any, 200);
      invalidateOrders();
      queryClient.invalidateQueries({ queryKey: getGetApiOrdersIdQueryKey(id) });
      toast.show("Order status updated", "success");
    } catch (err: any) {
      // This is the fix that matters most here: a rejected transition
      // (e.g. skipping straight to "completed") used to resolve silently
      // as if it succeeded, since the fetch client doesn't throw on 409.
      toast.show(err?.message ?? "Could not update order status", "danger");
    }
  }

  function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[current];
  }

  async function createOrder(input: { customerId?: string | null; items: { menuItemId: string; quantity: number }[] }) {
    const result = await createMutation.mutateAsync({ data: input });
    const order = unwrapOrThrow<{ id: string }>(result as any, 201);
    invalidateOrders();
    toast.show("Order created", "success");
    return order.id;
  }

  return {
    updateStatus,
    getValidNextStatuses,
    createOrder,
    isPending: statusMutation.isPending,
    isCreating: createMutation.isPending,
  };
}

export { ORDER_STATUS_LABELS };
