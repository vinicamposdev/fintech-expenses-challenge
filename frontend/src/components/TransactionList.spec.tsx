import { describe, expect, it, vi } from 'vitest';
import { TransactionList } from './TransactionList';
import { makeCategory, makeTransaction } from '../test/fixtures';
import { renderWithProviders, screen, within } from '../test/utils';

const categories = [
  makeCategory(),
  makeCategory({ id: 'category-2', name: 'Salary' }),
];

const transactions = [
  makeTransaction({ description: 'Weekly shopping', amount: 120.5, type: 'SAIDA' }),
  makeTransaction({
    id: 'transaction-2',
    description: 'Monthly salary',
    amount: 3000,
    type: 'ENTRADA',
    categoryId: 'category-2',
  }),
];

function renderList(overrides: Partial<Parameters<typeof TransactionList>[0]> = {}) {
  const props = {
    transactions,
    categories,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isDeleting: false,
    ...overrides,
  };
  return { props, ...renderWithProviders(<TransactionList {...props} />) };
}

describe('TransactionList', () => {
  it('renders a row per transaction under the header row', () => {
    renderList();

    expect(screen.getAllByRole('row')).toHaveLength(transactions.length + 1);
  });

  it('resolves the category name from the id', () => {
    renderList();

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('falls back to "Uncategorized" when the category is unknown', () => {
    renderList({ categories: [] });

    expect(screen.getAllByText('Uncategorized')).toHaveLength(2);
  });

  it('signs amounts by direction', () => {
    renderList();

    expect(screen.getByText('-$120.50')).toBeInTheDocument();
    expect(screen.getByText('+$3,000.00')).toBeInTheDocument();
  });

  it('labels the type in the reader language rather than the API enum', () => {
    renderList();

    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.queryByText('SAIDA')).not.toBeInTheDocument();
  });

  it('reports the transaction to edit', async () => {
    const { props, user } = renderList();
    const row = screen.getByText('Weekly shopping').closest('tr')!;

    await user.click(within(row).getAllByRole('button')[0]);

    expect(props.onEdit).toHaveBeenCalledWith('transaction-1');
  });

  it('reports the transaction to delete', async () => {
    const { props, user } = renderList();
    const row = screen.getByText('Monthly salary').closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    expect(props.onDelete).toHaveBeenCalledWith('transaction-2');
  });

  it('disables delete while a delete is in flight', () => {
    renderList({ isDeleting: true });
    const row = screen.getByText('Weekly shopping').closest('tr')!;

    expect(within(row).getAllByRole('button')[1]).toBeDisabled();
  });

  it('renders only the header row when there is nothing to list', () => {
    renderList({ transactions: [] });

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});
