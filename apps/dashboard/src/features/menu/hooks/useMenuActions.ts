import { useQueryClient } from "@tanstack/react-query";
import {
  usePostApiMenuItems,
  usePatchApiMenuItemsId,
  usePostApiMenuCategories,
  usePatchApiMenuCategoriesId,
  getGetApiMenuQueryKey,
} from "api-client";
import { useToast } from "../../../components/primitives/Toast";

export function useMenuActions() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetApiMenuQueryKey() });

  const createMutation = usePostApiMenuItems({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.show("Item created", "success");
      },
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not create item", "danger"),
    },
  });

  const updateMutation = usePatchApiMenuItemsId({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast.show("Item updated", "success");
      },
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not update item", "danger"),
    },
  });

  const createCategoryMutation = usePostApiMenuCategories({
    mutation: {
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not create category", "danger"),
    },
  });

  const updateCategoryMutation = usePatchApiMenuCategoriesId({
    mutation: {
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not reorder categories", "danger"),
    },
  });

  function saveItem(input: {
    id?: string;
    categoryId: string;
    name: string;
    description: string;
    priceCents: number;
    isAvailable: boolean;
  }) {
    if (input.id) {
      const { id, ...data } = input;
      updateMutation.mutate({ id, data });
    } else {
      const { id, ...data } = input;
      createMutation.mutate({ data });
    }
  }

  async function createCategory(name: string): Promise<string> {
    const result = await createCategoryMutation.mutateAsync({ data: { name, sortOrder: 0 } });
    invalidate();
    return (result as any).data.id;
  }

  // Swaps sortOrder between a category and its immediate neighbor in the
  // given (already sorted) list, then invalidates so the new order reflects
  // everywhere. Two sequential PATCH calls rather than a single bulk
  // endpoint — simple and sufficient for a handful of categories.
  async function moveCategory(
    sortedCategories: { id: string; sortOrder: number }[],
    categoryId: string,
    direction: "up" | "down"
  ) {
    const idx = sortedCategories.findIndex((c) => c.id === categoryId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sortedCategories.length) return;

    const current = sortedCategories[idx];
    const neighbor = sortedCategories[swapIdx];

    await Promise.all([
      updateCategoryMutation.mutateAsync({ id: current.id, data: { sortOrder: neighbor.sortOrder } }),
      updateCategoryMutation.mutateAsync({ id: neighbor.id, data: { sortOrder: current.sortOrder } }),
    ]);
    invalidate();
  }

  return {
    saveItem,
    createCategory,
    moveCategory,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
    isReordering: updateCategoryMutation.isPending,
  };
}
