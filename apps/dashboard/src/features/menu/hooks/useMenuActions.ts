import { useQueryClient } from "@tanstack/react-query";
import {
  usePostApiMenuItems,
  usePatchApiMenuItemsId,
  usePostApiMenuCategories,
  usePatchApiMenuCategoriesId,
  getGetApiMenuQueryKey,
} from "api-client";
import { useToast } from "../../../components/primitives/Toast";

// Orval's fetch client resolves (never rejects) for ANY completed HTTP
// response, success or error — mirroring native fetch()'s own behavior of
// only rejecting on network failure, not on non-2xx statuses. mutateAsync()
// does NOT throw just because the server returned 409/422. Every call site
// below explicitly checks the resolved status and throws itself when it
// isn't the expected success code — skipping this check is what silently
// treated a rejected duplicate-name request as a success.
function unwrapOrThrow<T>(result: { status: number; data: any }, expectedStatus: number): T {
  if (result.status !== expectedStatus) {
    throw new Error(result.data?.error?.message ?? "Something went wrong");
  }
  return result.data as T;
}

export function useMenuActions() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetApiMenuQueryKey() });

  const createMutation = usePostApiMenuItems();
  const updateMutation = usePatchApiMenuItemsId();
  const createCategoryMutation = usePostApiMenuCategories();
  const updateCategoryMutation = usePatchApiMenuCategoriesId({
    mutation: {
      onError: (err: any) => toast.show(err?.message ?? "Could not reorder categories", "danger"),
    },
  });

  // Throws on failure — including HTTP-level failures like a duplicate
  // name — so the caller can surface a field-level error, not just a toast.
  async function saveItem(input: {
    id?: string;
    categoryId: string;
    name: string;
    description: string;
    priceCents: number;
    isAvailable: boolean;
  }) {
    if (input.id) {
      const { id, ...data } = input;
      const result = await updateMutation.mutateAsync({ id, data });
      unwrapOrThrow(result as any, 200);
    } else {
      const { id, ...data } = input;
      const result = await createMutation.mutateAsync({ data });
      unwrapOrThrow(result as any, 201);
    }
    invalidate();
    toast.show(input.id ? "Item updated" : "Item created", "success");
  }

  async function createCategory(name: string): Promise<string> {
    const result = await createCategoryMutation.mutateAsync({ data: { name, sortOrder: 0 } });
    const category = unwrapOrThrow<{ id: string }>(result as any, 201);
    invalidate();
    return category.id;
  }

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
