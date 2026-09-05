import { useQueryClient } from "@tanstack/react-query";
import {
  usePatchApiOrdersIdStatus,
  usePostApiOrders,
  getGetApiOrdersQueryKey,
  getGetApiOrdersIdQueryKey,
} from "api-client";
import { useToast } from "../../../components/primitives/Toast";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS, type OrderStatus } from "shared/src/orderStatus";

// Feature-level hook: wraps generated mutations with the UI concerns a page
// actually needs (cache invalidation, toasts). Pages call this, never the
// generated hooks or `fetch` directly.
export function useOrderActions(orderId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidateOrders = () => queryClient.invalidateQueries({ queryKey: getGetApiOrdersQueryKey() });

  const statusMutation = usePatchApiOrdersIdStatus({
    mutation: {
      onSuccess: (_data, variables) => {
        invalidateOrders();
        if (variables?.id) {
          queryClient.invalidateQueries({ queryKey: getGetApiOrdersIdQueryKey(variables.id) });
        }
        toast.show("Order status updated", "success");
      },
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not update order status", "danger"),
    },
  });

  const createMutation = usePostApiOrders({
    mutation: {
      onSuccess: () => {
        invalidateOrders();
        toast.show("Order created", "success");
      },
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not create order", "danger"),
    },
  });

  function updateStatus(id: string, status: OrderStatus) {
    statusMutation.mutate({ id, data: { status } });
  }

  function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[current];
  }

  async function createOrder(input: { customerId?: string | null; items: { menuItemId: string; quantity: number }[] }) {
    const result = await createMutation.mutateAsync({ data: input });
    return (result as any).data.id as string;
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
