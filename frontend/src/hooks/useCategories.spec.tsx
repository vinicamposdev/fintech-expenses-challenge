import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { useCategories, useCreateCategory, useDeleteCategory } from './useCategories';
import { useToasts } from '../context/ToastContext';
import { api } from '../test/handlers';
import { makeCategory } from '../test/fixtures';
import { server } from '../test/server';
import { act, renderHookWithProviders, waitFor } from '../test/utils';

describe('useCategories', () => {
  it('unwraps the categories from the API envelope', async () => {
    const { result } = renderHookWithProviders(() => useCategories());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((category) => category.name)).toEqual([
      'Groceries',
      'Transport',
    ]);
  });

  it('reports a failed load', async () => {
    server.use(http.get(api('/categories'), () => new HttpResponse(null, { status: 500 })));

    const { result } = renderHookWithProviders(() => useCategories());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('invalidates the list and toasts after a create', async () => {
    const { result, queryClient } = renderHookWithProviders(() => ({
      create: useCreateCategory(),
      toasts: useToasts(),
    }));
    queryClient.setQueryData(['categories'], [makeCategory()]);

    await act(async () => {
      await result.current.create.mutateAsync({ name: 'Utilities' });
    });

    await waitFor(() =>
      expect(queryClient.getQueryState(['categories'])?.isInvalidated).toBe(true)
    );
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Category created successfully',
      type: 'success',
    });
  });

  it('toasts an error when a delete fails', async () => {
    server.use(
      http.delete(api('/categories/:id'), () => new HttpResponse(null, { status: 409 }))
    );
    const { result } = renderHookWithProviders(() => ({
      remove: useDeleteCategory(),
      toasts: useToasts(),
    }));

    await act(async () => {
      await result.current.remove.mutateAsync('category-1').catch(() => {});
    });

    await waitFor(() => expect(result.current.toasts[0]?.type).toBe('error'));
  });
});
