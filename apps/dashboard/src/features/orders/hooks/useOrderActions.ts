import { useQueryClient } from "@tanstack/react-query";
import {
  usePatchApiOrdersIdStatus,
  getGetApiOrdersQueryKey,
  getGetApiOrdersIdQueryKey,
} from "api-client";
import { useToast } from "../../../components/primitives/Toast";
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS, type OrderStatus } from "shared/src/orderStatus";

// Feature-level hook: wraps the generated mutation with the UI concerns a
// page actually needs (cache invalidation, toasts). Pages call this, never
// the generated hook or `fetch` directly.
export function useOrderActions(orderId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = usePatchApiOrdersIdStatus({
    mutation: {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: getGetApiOrdersQueryKey() });
        if (variables?.id) {
          queryClient.invalidateQueries({ queryKey: getGetApiOrdersIdQueryKey(variables.id) });
        }
        toast.show("Order status updated", "success");
      },
      onError: (err: any) => {
        const message = err?.body?.error?.message ?? "Could not update order status";
        toast.show(message, "danger");
      },
    },
  });

  function updateStatus(id: string, status: OrderStatus) {
    mutation.mutate({ id, data: { status } });
  }

  function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[current];
  }

  return { updateStatus, getValidNextStatuses, isPending: mutation.isPending };
}

export { ORDER_STATUS_LABELS };
