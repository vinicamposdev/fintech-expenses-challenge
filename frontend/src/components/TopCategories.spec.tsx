import { describe, expect, it } from 'vitest';
import { TopCategories } from './TopCategories';
import { renderWithProviders, screen } from '../test/utils';

const categories = [
  { categoryId: 'category-1', categoryName: 'Groceries', totalOutflow: 900 },
  { categoryId: 'category-2', categoryName: 'Transport', totalOutflow: 450 },
];

describe('TopCategories', () => {
  it('lists each category with its outflow', () => {
    renderWithProviders(<TopCategories categories={categories} />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('-$900.00')).toBeInTheDocument();
    expect(screen.getByText('-$450.00')).toBeInTheDocument();
  });

  it('ranks the categories in the order given', () => {
    renderWithProviders(<TopCategories categories={categories} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('scales the bars against the largest outflow', () => {
    renderWithProviders(<TopCategories categories={categories} />);

    const bars = screen.getAllByRole('progressbar');
    expect(bars[0]).toHaveAttribute('aria-valuenow', '100');
    expect(bars[1]).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows an empty state instead of an empty chart', () => {
    renderWithProviders(<TopCategories categories={[]} />);

    expect(screen.getByText('No expenses recorded in this period')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
