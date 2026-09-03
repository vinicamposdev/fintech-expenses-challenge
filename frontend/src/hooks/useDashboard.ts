import { useQuery } from '@tanstack/react-query';
import type { QueryDashboardParams } from '../api/dashboard';
import { getDashboard } from '../api/dashboard';

export function useDashboard(params?: QueryDashboardParams) {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => getDashboard(params),
  });
}
