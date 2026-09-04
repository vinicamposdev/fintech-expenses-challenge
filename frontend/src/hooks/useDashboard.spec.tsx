import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { useDashboard } from './useDashboard';
import { api } from '../test/handlers';
import { server } from '../test/server';
import { renderHookWithProviders, waitFor } from '../test/utils';

describe('useDashboard', () => {
  it('returns the summary', async () => {
    const { result } = renderHookWithProviders(() => useDashboard());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ balance: 1500, totalEntrada: 3000 });
  });

  it('passes the date range to the API', async () => {
    let url = '';
    server.use(
      http.get(api('/dashboard'), ({ request }) => {
        url = request.url;
        return HttpResponse.json({ data: { balance: 0, totalEntrada: 0, totalSaida: 0, topCategories: [] } });
      })
    );

    const { result } = renderHookWithProviders(() =>
      useDashboard({ startDate: '2026-01-01', endDate: '2026-01-31' })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url).toContain('startDate=2026-01-01');
    expect(url).toContain('endDate=2026-01-31');
  });

  it('caches per date range rather than sharing one entry', async () => {
    const { result, queryClient } = renderHookWithProviders(() =>
      useDashboard({ startDate: '2026-01-01' })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['dashboard', { startDate: '2026-01-01' }])).toBeDefined();
    expect(queryClient.getQueryData(['dashboard', undefined])).toBeUndefined();
  });

  it('reports a failed load', async () => {
    server.use(http.get(api('/dashboard'), () => new HttpResponse(null, { status: 500 })));

    const { result } = renderHookWithProviders(() => useDashboard());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
