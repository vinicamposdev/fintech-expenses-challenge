import type { ReactElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ToastContainer } from '../components/ToastContainer';
import { routes } from '../lib/router';
import { theme } from '../theme';
import { createTestQueryClient } from './utils';

/**
 * Mounts the whole app - the real route tree, providers and API layer - in a
 * memory router, so end-to-end tests exercise what `App.tsx` renders in the
 * browser without a real one.
 */
export function renderApp(initialRoute = '/'): RenderResult & {
  user: ReturnType<typeof userEvent.setup>;
  router: ReturnType<typeof createMemoryRouter>;
} {
  const router = createMemoryRouter(routes, { initialEntries: [initialRoute] });
  const queryClient = createTestQueryClient();

  const ui: ReactElement = (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  return { user: userEvent.setup(), router, ...render(ui) };
}
