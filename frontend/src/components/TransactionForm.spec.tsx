import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { TransactionForm } from './TransactionForm';
import { api } from '../test/handlers';
import { makeTransaction } from '../test/fixtures';
import { server } from '../test/server';
import { renderWithProviders, screen, waitFor } from '../test/utils';

function renderForm(editingId: string | null = null) {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  return {
    onSuccess,
    onCancel,
    ...renderWithProviders(
      <TransactionForm editingId={editingId} onSuccess={onSuccess} onCancel={onCancel} />
    ),
  };
}

type User = ReturnType<typeof renderForm>['user'];

/**
 * Picks an option from a MUI select and waits for the menu to close - its
 * closing backdrop swallows the next click while the transition runs.
 */
async function selectOption(user: User, field: RegExp, option: string): Promise<void> {
  await user.click(screen.getByRole('combobox', { name: field }));
  await user.click(await screen.findByRole('option', { name: option }));
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
}

async function fillNewTransaction(user: User): Promise<void> {
  await user.type(screen.getByLabelText(/description/i), 'Coffee');
  await user.type(screen.getByLabelText(/amount/i), '12.5');
  await selectOption(user, /^type/i, 'Expense');
  await selectOption(user, /category/i, 'Groceries');
  await user.type(screen.getByLabelText(/date/i), '2026-02-10');
}

describe('TransactionForm', () => {
  it('keeps submit disabled until an amount is entered', async () => {
    const { user } = renderForm();

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await user.type(screen.getByLabelText(/amount/i), '10');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled());
  });

  it('rejects a zero or negative amount', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText(/description/i), 'Coffee');
    await user.type(screen.getByLabelText(/amount/i), '-5');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Amount must be greater than 0')).toBeInTheDocument();
  });

  it('requires a description, category and date', async () => {
    const { user, onSuccess } = renderForm();

    await user.type(screen.getByLabelText(/amount/i), '10');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('offers the categories loaded from the API', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('combobox', { name: /category/i }));

    expect(await screen.findByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument();
  });

  it('posts the transaction with the amount as a number', async () => {
    let payload: Record<string, unknown> | undefined;
    server.use(
      http.post(api('/transactions'), async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ data: makeTransaction() }, { status: 201 });
      })
    );
    const { user, onSuccess } = renderForm();

    await fillNewTransaction(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(payload).toEqual({
      description: 'Coffee',
      amount: 12.5,
      type: 'SAIDA',
      categoryId: 'category-1',
      date: '2026-02-10',
    });
  });

  it('prefills the transaction being edited', async () => {
    renderForm('transaction-1');

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toHaveValue('Weekly shopping');
    });
    expect(screen.getByLabelText(/amount/i)).toHaveValue(120.5);
    expect(screen.getByLabelText(/date/i)).toHaveValue('2026-02-10');
  });

  it('patches the existing transaction when editing', async () => {
    let method = '';
    server.use(
      http.patch(api('/transactions/:id'), async ({ request }) => {
        method = request.method;
        return HttpResponse.json({ data: makeTransaction({ description: 'Weekly groceries' }) });
      })
    );
    const { user, onSuccess } = renderForm('transaction-1');

    await waitFor(() =>
      expect(screen.getByLabelText(/description/i)).toHaveValue('Weekly shopping')
    );
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), 'Weekly groceries');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(method).toBe('PATCH');
  });

  it('surfaces an API failure and keeps the form open', async () => {
    server.use(
      http.post(api('/transactions'), () =>
        HttpResponse.json({ message: 'Category not found' }, { status: 400 })
      )
    );
    const { user, onSuccess } = renderForm();

    await fillNewTransaction(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const form = screen.getByRole('button', { name: 'Create' }).closest('form')!;
    await waitFor(() => expect(form.querySelector('[role="alert"]')).toBeTruthy());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { user, onCancel } = renderForm();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
