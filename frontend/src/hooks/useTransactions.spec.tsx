import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from './useTransactions';
import { useToasts } from '../context/ToastContext';
import { api } from '../test/handlers';
import { makeTransaction } from '../test/fixtures';
import { server } from '../test/server';
import { act, renderHookWithProviders, waitFor } from '../test/utils';

describe('useTransactions', () => {
  it('returns the page of transactions with its meta', async () => {
    const { result } = renderHookWithProviders(() => useTransactions({ page: 1, limit: 10 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('sends the filters as query parameters', async () => {
    let url = '';
    server.use(
      http.get(api('/transactions'), ({ request }) => {
        url = request.url;
        return HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useTransactions({ page: 2, limit: 5, type: 'SAIDA', categoryId: 'category-1' })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url).toContain('page=2');
    expect(url).toContain('type=SAIDA');
    expect(url).toContain('categoryId=category-1');
  });

  it('substitutes empty meta when the API omits it', async () => {
    server.use(http.get(api('/transactions'), () => HttpResponse.json({ data: [] })));

    const { result } = renderHookWithProviders(() => useTransactions());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.meta).toEqual({ total: 0, page: 1, limit: 10, totalPages: 0 });
  });

  it('reports a failed load', async () => {
    server.use(http.get(api('/transactions'), () => new HttpResponse(null, { status: 500 })));

    const { result } = renderHookWithProviders(() => useTransactions());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('transaction mutations', () => {
  it('invalidates transactions and the dashboard after a create', async () => {
    const { result, queryClient } = renderHookWithProviders(() => ({
      create: useCreateTransaction(),
      toasts: useToasts(),
    }));
    queryClient.setQueryData(['dashboard', undefined], { balance: 0 });

    await act(async () => {
      await result.current.create.mutateAsync({
        description: 'Coffee',
        amount: 12.5,
        type: 'SAIDA',
        date: '2026-02-10',
        categoryId: 'category-1',
      });
    });

    await waitFor(() =>
      expect(queryClient.getQueryState(['dashboard', undefined])?.isInvalidated).toBe(true)
    );
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Transaction created successfully',
      type: 'success',
    });
  });

  it('toasts an error when a create fails', async () => {
    server.use(http.post(api('/transactions'), () => new HttpResponse(null, { status: 400 })));
    const { result } = renderHookWithProviders(() => ({
      create: useCreateTransaction(),
      toasts: useToasts(),
    }));

    await act(async () => {
      await result.current.create
        .mutateAsync({
          description: 'Coffee',
          amount: 12.5,
          type: 'SAIDA',
          date: '2026-02-10',
          categoryId: 'category-1',
        })
        .catch(() => {});
    });

    await waitFor(() => expect(result.current.toasts[0]?.type).toBe('error'));
  });

  it('writes the updated transaction into its own cache entry', async () => {
    const { result, queryClient } = renderHookWithProviders(() => ({
      update: useUpdateTransaction(),
      toasts: useToasts(),
    }));

    await act(async () => {
      await result.current.update.mutateAsync({
        id: 'transaction-1',
        payload: { description: 'Weekly groceries' },
      });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(['transactions', 'transaction-1'])).toMatchObject({
        description: 'Weekly groceries',
      })
    );
  });

  it('removes the deleted transaction from the cache', async () => {
    const { result, queryClient } = renderHookWithProviders(() => ({
      remove: useDeleteTransaction(),
      toasts: useToasts(),
    }));
    queryClient.setQueryData(['transactions', 'transaction-1'], makeTransaction());

    await act(async () => {
      await result.current.remove.mutateAsync('transaction-1');
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(['transactions', 'transaction-1'])).toBeUndefined()
    );
    expect(result.current.toasts[0]).toMatchObject({ type: 'success' });
  });
});
