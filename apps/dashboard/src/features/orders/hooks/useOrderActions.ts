// This file is the pattern every feature module follows: it wraps the
// Orval-generated hooks (which only know about the network) with the
// UI-specific behavior a page actually needs — toasts, cache invalidation,
// disallowed-transition guarding. Pages call THIS hook, never the generated
// one directly, and never talk to `fetch` themselves.
//
// The import below assumes `pnpm gen:contract` has been run so
// packages/api-client/src/generated exists. Until then this file won't
// type-check — that's intentional, it's the contract for what's next.

import { useQueryClient } from "@tanstack/react-query";
// import { usePatchOrdersIdStatus, getGetOrdersQueryKey } from "api-client";
import { useToast } from "../../../components/primitives/Toast";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "shared/src/orderStatus";

export function useOrderActions() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Once generated hooks exist, replace this stub with:
  //
  // const mutation = usePatchOrdersIdStatus({
  //   mutation: {
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
  //       toast.show("Order status updated", "success");
  //     },
  //     onError: (err) => toast.show(err.message ?? "Could not update order", "danger"),
  //   },
  // });
  //
  // const updateStatus = (orderId: string, status: OrderStatus) =>
  //   mutation.mutate({ id: orderId, data: { status } });

  function getValidNextStatuses(current: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[current] as OrderStatus[];
  }

  return { getValidNextStatuses };
}
