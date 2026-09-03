import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryTransactionsParams } from '../api/transactions';
import * as transactionsApi from '../api/transactions';

const TRANSACTIONS_QUERY_KEY = ['transactions'];

export function useTransactions(params?: QueryTransactionsParams) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () => transactionsApi.getTransactions(params),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, id],
    queryFn: () => transactionsApi.getTransaction(id),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof transactionsApi.updateTransaction>[1];
    }) => transactionsApi.updateTransaction(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.setQueryData([...TRANSACTIONS_QUERY_KEY, data.id], data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.deleteTransaction,
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: [...TRANSACTIONS_QUERY_KEY, transactionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
