import { QueryClient } from '@tanstack/react-query';

/**
 * React Query configuration for server state management.
 *
 * Server state (data from backend API) is fundamentally different from client state:
 * - It's cached and shared across the app
 * - It can become stale and needs invalidation strategies
 * - Multiple components may request the same data
 * - Mutations must trigger cache updates (pessimistic or optimistic)
 *
 * React Query excels here because:
 * - Context API is for genuinely global state (auth session, UI theme) — small, read-mostly
 * - Redux/Zustand require manual action creators and synchronization with the API layer
 * - React Query automates cache invalidation and deduplicates in-flight requests
 *
 * For this app: auth session stays in Context (small, tied to localStorage), but all
 * categories/transactions/dashboard data flows through React Query hooks.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
