import { apiClient } from '../lib/client';
import type { Category } from '../types';

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}

interface ApiResponse<T> {
  data: T;
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return response.data.data;
}

export async function getCategory(id: string): Promise<Category> {
  const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
  return response.data.data;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const response = await apiClient.post<ApiResponse<Category>>('/categories', payload);
  return response.data.data;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<Category> {
  const response = await apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, payload);
  return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
