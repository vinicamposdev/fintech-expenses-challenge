import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { Dashboard } from './Dashboard';
import { api } from '../test/handlers';
import { makeDashboard } from '../test/fixtures';
import { server } from '../test/server';
import { renderWithProviders, screen, waitFor } from '../test/utils';

describe('Dashboard page', () => {
  it('shows a spinner while the summary loads', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the totals and top categories once loaded', async () => {
    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('Top Categories by Outflow')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('shows an error instead of empty cards when the request fails', async () => {
    server.use(http.get(api('/dashboard'), () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(<Dashboard />);

    expect(
      await screen.findByText('Failed to load dashboard. Please try again.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Current Balance')).not.toBeInTheDocument();
  });

  it('refetches with the selected date range', async () => {
    const requested: string[] = [];
    server.use(
      http.get(api('/dashboard'), ({ request }) => {
        requested.push(new URL(request.url).search);
        return HttpResponse.json({ data: makeDashboard() });
      })
    );
    const { user } = renderWithProviders(<Dashboard />);
    await screen.findByText('Current Balance');

    await user.type(screen.getByLabelText(/start date/i), '2026-01-01');
    await user.type(screen.getByLabelText(/end date/i), '2026-01-31');

    await waitFor(() => {
      expect(requested.at(-1)).toContain('startDate=2026-01-01');
    });
    expect(requested.at(-1)).toContain('endDate=2026-01-31');
  });

  it('captions the cards with the selected range', async () => {
    const { user } = renderWithProviders(<Dashboard />);
    await screen.findByText('Current Balance');

    await user.type(screen.getByLabelText(/start date/i), '2026-01-01');

    expect((await screen.findAllByText('2026-01-01 to Today')).length).toBe(2);
  });

  it('clears the date filters', async () => {
    const { user } = renderWithProviders(<Dashboard />);
    await screen.findByText('Current Balance');
    await user.type(screen.getByLabelText(/start date/i), '2026-01-01');

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByLabelText(/start date/i)).toHaveValue('');
    await waitFor(() => expect(screen.getAllByText('All Time')).toHaveLength(3));
  });

  it('shows the empty state when there are no expenses in the period', async () => {
    server.use(
      http.get(api('/dashboard'), () =>
        HttpResponse.json({ data: makeDashboard({ topCategories: [] }) })
      )
    );

    renderWithProviders(<Dashboard />);

    expect(await screen.findByText('No expenses recorded in this period')).toBeInTheDocument();
  });
});
