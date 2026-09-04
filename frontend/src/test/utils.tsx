import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import {
  render,
  renderHook,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ToastContainer } from '../components/ToastContainer';
import { theme } from '../theme';

/**
 * Retries and caching are useful in the app and only make tests slow and
 * order-dependent, so every test gets a fresh, retry-free client.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial history entries for the surrounding MemoryRouter. */
  route?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', queryClient = createTestQueryClient(), ...options }: RenderWithProvidersOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup>; queryClient: QueryClient } {
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
              <ToastContainer />
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

/** The hook equivalent of `renderWithProviders`, sharing the same wrapper. */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  { route = '/', queryClient = createTestQueryClient() }: RenderWithProvidersOptions = {}
): RenderHookResult<Result, void> & { queryClient: QueryClient } {
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return { queryClient, ...renderHook(hook, { wrapper: Wrapper }) };
}

export * from '@testing-library/react';
export { userEvent };
