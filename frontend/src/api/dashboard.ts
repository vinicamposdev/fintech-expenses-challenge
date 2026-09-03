import { apiClient } from '../lib/client';
import type { DashboardSummary } from '../types';

export interface QueryDashboardParams {
  startDate?: string;
  endDate?: string;
}

interface ApiResponse<T> {
  data: T;
}

export async function getDashboard(params?: QueryDashboardParams): Promise<DashboardSummary> {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard', { params });
  return response.data.data;
}
