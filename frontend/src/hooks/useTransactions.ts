import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
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
  const { addToast } = useToast();

  return useMutation({
    mutationFn: transactionsApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Transaction created successfully', 'success');
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Failed to create transaction', 'error');
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

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
      addToast('Transaction updated successfully', 'success');
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Failed to update transaction', 'error');
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: transactionsApi.deleteTransaction,
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: [...TRANSACTIONS_QUERY_KEY, transactionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Transaction deleted successfully', 'success');
    },
    onError: (error) => {
      addToast(error instanceof Error ? error.message : 'Failed to delete transaction', 'error');
    },
  });
}
