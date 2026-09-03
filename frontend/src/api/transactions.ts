import { apiClient } from '../lib/client';
import type { PaginatedResponse, Transaction } from '../types';

export interface CreateTransactionPayload {
  description: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  date: string;
  categoryId: string;
}

export interface UpdateTransactionPayload {
  description?: string;
  amount?: number;
  type?: 'ENTRADA' | 'SAIDA';
  date?: string;
  categoryId?: string;
}

export interface QueryTransactionsParams {
  page?: number;
  limit?: number;
  type?: 'ENTRADA' | 'SAIDA';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export async function getTransactions(
  params?: QueryTransactionsParams
): Promise<PaginatedResponse<Transaction>> {
  const response = await apiClient.get<ApiResponse<Transaction[]>>('/transactions', { params });
  return {
    data: response.data.data,
    meta: (response.data.meta as PaginatedResponse<Transaction>['meta']) || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  };
}

export async function getTransaction(id: string): Promise<Transaction> {
  const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
  return response.data.data;
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const response = await apiClient.post<ApiResponse<Transaction>>('/transactions', payload);
  return response.data.data;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload
): Promise<Transaction> {
  const response = await apiClient.patch<ApiResponse<Transaction>>(
    `/transactions/${id}`,
    payload
  );
  return response.data.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
