import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import * as categoriesApi from '../api/categories';

const CATEGORIES_QUERY_KEY = ['categories'];

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: categoriesApi.getCategories,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, id],
    queryFn: () => categoriesApi.getCategory(id),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      addToast('Category created successfully', 'success');
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Failed to create category', 'error');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof categoriesApi.updateCategory>[1];
    }) => categoriesApi.updateCategory(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.setQueryData([...CATEGORIES_QUERY_KEY, data.id], data);
      addToast('Category updated successfully', 'success');
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Failed to update category', 'error');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: (_, categoryId) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.removeQueries({ queryKey: [...CATEGORIES_QUERY_KEY, categoryId] });
      addToast('Category deleted successfully', 'success');
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Failed to delete category', 'error');
    },
  });
}
