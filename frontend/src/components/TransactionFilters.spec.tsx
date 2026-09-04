import { describe, expect, it, vi } from 'vitest';
import { TransactionFilters } from './TransactionFilters';
import { renderWithProviders, screen, waitFor } from '../test/utils';
import type { QueryTransactionsParams } from '../api/transactions';

function renderFilters(filters: QueryTransactionsParams = { page: 1, limit: 10 }) {
  const onFilterChange = vi.fn();
  return {
    onFilterChange,
    ...renderWithProviders(
      <TransactionFilters filters={filters} onFilterChange={onFilterChange} />
    ),
  };
}

describe('TransactionFilters', () => {
  it('offers the categories loaded from the API', async () => {
    const { user } = renderFilters();

    await user.click(screen.getByRole('combobox', { name: /category/i }));

    expect(await screen.findByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument();
  });

  it('reports the selected type', async () => {
    const { user, onFilterChange } = renderFilters();

    await user.click(screen.getByRole('combobox', { name: /type/i }));
    await user.click(await screen.findByRole('option', { name: 'Expense' }));

    expect(onFilterChange).toHaveBeenCalledWith({ type: 'SAIDA' });
  });

  it('clears the type filter rather than sending an empty string', async () => {
    const { user, onFilterChange } = renderFilters({ type: 'SAIDA' });

    await user.click(screen.getByRole('combobox', { name: /type/i }));
    await user.click(await screen.findByRole('option', { name: 'All types' }));

    expect(onFilterChange).toHaveBeenCalledWith({ type: undefined });
  });

  it('reports the selected category', async () => {
    const { user, onFilterChange } = renderFilters();

    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(await screen.findByRole('option', { name: 'Transport' }));

    expect(onFilterChange).toHaveBeenCalledWith({ categoryId: 'category-2' });
  });

  it('reports a start date', async () => {
    const { user, onFilterChange } = renderFilters();

    await user.type(screen.getByLabelText(/start date/i), '2026-01-01');

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith({ startDate: '2026-01-01' });
    });
  });

  it('resets every filter at once when cleared', async () => {
    const { user, onFilterChange } = renderFilters({
      type: 'SAIDA',
      categoryId: 'category-1',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onFilterChange).toHaveBeenCalledWith({
      type: undefined,
      categoryId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('shows the filters currently applied', () => {
    renderFilters({ startDate: '2026-01-01', endDate: '2026-01-31' });

    expect(screen.getByLabelText(/start date/i)).toHaveValue('2026-01-01');
    expect(screen.getByLabelText(/end date/i)).toHaveValue('2026-01-31');
  });
});
