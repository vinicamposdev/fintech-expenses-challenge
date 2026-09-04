import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { Transactions } from './Transactions';
import { api } from '../test/handlers';
import { makeTransaction, paginate } from '../test/fixtures';
import { server } from '../test/server';
import { renderWithProviders, screen, waitFor, within } from '../test/utils';

describe('Transactions page', () => {
  it('lists the transactions with their category names', async () => {
    renderWithProviders(<Transactions />);

    expect(await screen.findByText('Weekly shopping')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('shows an error when the list fails to load', async () => {
    server.use(http.get(api('/transactions'), () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(<Transactions />);

    expect(
      await screen.findByText('Failed to load transactions. Please try again.')
    ).toBeInTheDocument();
  });

  it('offers a first-transaction prompt when the list is empty', async () => {
    server.use(http.get(api('/transactions'), () => HttpResponse.json(paginate([]))));

    renderWithProviders(<Transactions />);

    expect(await screen.findByText('No transactions found')).toBeInTheDocument();
  });

  it('sends the chosen filter to the API and resets to the first page', async () => {
    const searches: string[] = [];
    server.use(
      http.get(api('/transactions'), ({ request }) => {
        searches.push(new URL(request.url).search);
        return HttpResponse.json(paginate([makeTransaction()], { totalPages: 3, total: 25 }));
      })
    );
    const { user } = renderWithProviders(<Transactions />);
    await screen.findByText('Weekly shopping');

    await user.click(screen.getByRole('combobox', { name: /type/i }));
    await user.click(await screen.findByRole('option', { name: 'Income' }));

    await waitFor(() => expect(searches.at(-1)).toContain('type=ENTRADA'));
    expect(searches.at(-1)).toContain('page=1');
  });

  it('pages through the results', async () => {
    const searches: string[] = [];
    server.use(
      http.get(api('/transactions'), ({ request }) => {
        searches.push(new URL(request.url).search);
        return HttpResponse.json(paginate([makeTransaction()], { total: 25, totalPages: 3 }));
      })
    );
    const { user } = renderWithProviders(<Transactions />);
    await screen.findByText('Weekly shopping');

    await user.click(await screen.findByRole('button', { name: 'Go to page 2' }));

    await waitFor(() => expect(searches.at(-1)).toContain('page=2'));
  });

  it('creates a transaction and closes the dialog', async () => {
    const { user } = renderWithProviders(<Transactions />);
    await screen.findByText('Weekly shopping');

    await user.click(screen.getByRole('button', { name: /new transaction/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/description/i), 'Coffee');
    await user.type(within(dialog).getByLabelText(/amount/i), '12.5');
    await user.click(within(dialog).getByRole('combobox', { name: /^type/i }));
    await user.click(await screen.findByRole('option', { name: 'Expense' }));
    await user.click(within(dialog).getByRole('combobox', { name: /category/i }));
    await user.click(await screen.findByRole('option', { name: 'Groceries' }));
    await user.type(within(dialog).getByLabelText(/date/i), '2026-02-10');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the edit dialog prefilled with the chosen transaction', async () => {
    const { user } = renderWithProviders(<Transactions />);
    const row = (await screen.findByText('Weekly shopping')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[0]);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Edit Transaction');
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/description/i)).toHaveValue('Weekly shopping')
    );
  });

  it('does not delete when the confirmation is declined', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    let deleted = false;
    server.use(
      http.delete(api('/transactions/:id'), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { user } = renderWithProviders(<Transactions />);
    const row = (await screen.findByText('Weekly shopping')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    expect(deleted).toBe(false);
    confirm.mockRestore();
  });

  it('deletes the transaction once confirmed and refreshes the list', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let remaining = [
      makeTransaction(),
      makeTransaction({ id: 'transaction-2', description: 'Salary payment', type: 'ENTRADA' }),
    ];
    server.use(
      http.get(api('/transactions'), () => HttpResponse.json(paginate(remaining))),
      http.delete(api('/transactions/:id'), ({ params }) => {
        remaining = remaining.filter((transaction) => transaction.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { user } = renderWithProviders(<Transactions />);
    const row = (await screen.findByText('Weekly shopping')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    await waitFor(() => expect(screen.queryByText('Weekly shopping')).not.toBeInTheDocument());
    expect(screen.getByText('Salary payment')).toBeInTheDocument();
    confirm.mockRestore();
  });
});
