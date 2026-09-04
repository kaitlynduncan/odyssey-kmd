import { useQueryClient } from "@tanstack/react-query";
import {
  usePostApiMenuItems,
  usePatchApiMenuItemsId,
  usePostApiMenuCategories,
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

  // No onSuccess toast here — creating a category is an implicit step inside
  // saving an item, not its own user-facing action. The item-save toast
  // covers the whole flow.
  const createCategoryMutation = usePostApiMenuCategories({
    mutation: {
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not create category", "danger"),
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

  // Returns the new category's id so the caller can immediately use it as
  // the item's categoryId.
  async function createCategory(name: string): Promise<string> {
    const result = await createCategoryMutation.mutateAsync({ data: { name, sortOrder: 0 } });
    invalidate();
    return (result as any).data.id;
  }

  return {
    saveItem,
    createCategory,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
  };
}
