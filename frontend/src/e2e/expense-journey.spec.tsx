import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/app';
import { api } from '../test/handlers';
import {
  makeCategory,
  makeDashboard,
  makeTransaction,
  paginate,
  signIn,
} from '../test/fixtures';
import { server } from '../test/server';
import { screen, waitFor, within } from '../test/utils';
import type { Category, Transaction } from '../types';

/**
 * A mock API that actually stores what the app sends, so a journey can create
 * something on one page and see it on another - the part a per-endpoint stub
 * cannot cover.
 */
function useStatefulApi(): { categories: Category[]; transactions: Transaction[] } {
  const state = {
    categories: [makeCategory()] as Category[],
    transactions: [] as Transaction[],
  };
  let nextId = 1;

  server.use(
    http.get(api('/categories'), () => HttpResponse.json({ data: state.categories })),
    http.post(api('/categories'), async ({ request }) => {
      const body = (await request.json()) as { name: string; description?: string };
      const category = makeCategory({ id: `category-new-${nextId++}`, ...body });
      state.categories.push(category);
      return HttpResponse.json({ data: category }, { status: 201 });
    }),
    http.get(api('/transactions'), ({ request }) => {
      const type = new URL(request.url).searchParams.get('type');
      const visible = type
        ? state.transactions.filter((transaction) => transaction.type === type)
        : state.transactions;
      return HttpResponse.json(paginate(visible));
    }),
    http.post(api('/transactions'), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const transaction = makeTransaction({ id: `transaction-new-${nextId++}`, ...body });
      state.transactions.push(transaction);
      return HttpResponse.json({ data: transaction }, { status: 201 });
    }),
    http.delete(api('/transactions/:id'), ({ params }) => {
      state.transactions = state.transactions.filter(
        (transaction) => transaction.id !== params.id
      );
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(api('/dashboard'), () => {
      const totalSaida = state.transactions
        .filter((transaction) => transaction.type === 'SAIDA')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      return HttpResponse.json({
        data: makeDashboard({ totalSaida, balance: -totalSaida, topCategories: [] }),
      });
    })
  );

  return state;
}

function drawer(): HTMLElement {
  return document.querySelector('.MuiDrawer-root') as HTMLElement;
}

function navigateTo(name: RegExp): HTMLElement {
  return within(drawer()).getByRole('link', { name });
}

describe('e2e: recording an expense', () => {
  it('creates a category, spends against it, and sees the dashboard follow', async () => {
    useStatefulApi();
    signIn();
    const { user } = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    // Add the category the expense will belong to.
    await user.click(navigateTo(/categories/i));
    await user.click(await screen.findByRole('button', { name: /new category/i }));
    let dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/name/i), 'Utilities');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Utilities')).toBeInTheDocument();
    // The open dialog marks the rest of the page aria-hidden, so the nav links
    // are only reachable again once it has gone.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Record an expense against it.
    await user.click(navigateTo(/transactions/i));
    expect(await screen.findByText('No transactions found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /new transaction/i }));
    dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/description/i), 'Electricity bill');
    await user.type(within(dialog).getByLabelText(/amount/i), '90');
    await user.click(within(dialog).getByRole('combobox', { name: /^type/i }));
    await user.click(await screen.findByRole('option', { name: 'Expense' }));
    await user.click(within(dialog).getByRole('combobox', { name: /category/i }));
    await user.click(await screen.findByRole('option', { name: 'Utilities' }));
    await user.type(within(dialog).getByLabelText(/date/i), '2026-02-10');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Electricity bill')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('-$90.00')).toBeInTheDocument();

    // The dashboard picks the expense up, because creating one invalidates it.
    await user.click(navigateTo(/dashboard/i));
    expect(await screen.findByText('$90.00')).toBeInTheDocument();
  });

  it('filters the list down to income and back', async () => {
    const state = useStatefulApi();
    state.transactions.push(
      makeTransaction({ id: 'out', description: 'Rent', type: 'SAIDA' }),
      makeTransaction({ id: 'in', description: 'Salary payment', type: 'ENTRADA' })
    );
    signIn();
    const { user } = renderApp('/transactions');
    await screen.findByText('Rent');

    await user.click(screen.getByRole('combobox', { name: /type/i }));
    await user.click(await screen.findByRole('option', { name: 'Income' }));

    await waitFor(() => expect(screen.queryByText('Rent')).not.toBeInTheDocument());
    expect(screen.getByText('Salary payment')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(await screen.findByText('Rent')).toBeInTheDocument();
  });

  it('deletes a transaction after confirming and tells the user it worked', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const state = useStatefulApi();
    state.transactions.push(makeTransaction({ id: 'out', description: 'Rent' }));
    signIn();
    const { user } = renderApp('/transactions');
    const row = (await screen.findByText('Rent')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    await waitFor(() => expect(screen.queryByText('Rent')).not.toBeInTheDocument());
    expect(await screen.findByText('Transaction deleted successfully')).toBeInTheDocument();
    confirm.mockRestore();
  });

  it('drops the previous session data when a second user signs in', async () => {
    const state = useStatefulApi();
    state.transactions.push(makeTransaction({ id: 'out', description: 'Rent' }));
    signIn();
    const { user } = renderApp('/transactions');
    await screen.findByText('Rent');

    await user.click(within(drawer()).getByText('Logout'));
    await screen.findByRole('heading', { name: /sign in/i });

    state.transactions = [makeTransaction({ id: 'other', description: 'Second user expense' })];
    await user.type(screen.getByLabelText(/email address/i), 'grace@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByRole('heading', { name: 'Dashboard' });
    await user.click(navigateTo(/transactions/i));

    expect(await screen.findByText('Second user expense')).toBeInTheDocument();
    expect(screen.queryByText('Rent')).not.toBeInTheDocument();
  });
});
