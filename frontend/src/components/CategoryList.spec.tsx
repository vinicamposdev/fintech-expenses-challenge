import { describe, expect, it, vi } from 'vitest';
import { CategoryList } from './CategoryList';
import { makeCategory } from '../test/fixtures';
import { renderWithProviders, screen, within } from '../test/utils';

const categories = [
  makeCategory(),
  makeCategory({ id: 'category-2', name: 'Transport', description: undefined }),
];

function renderList(overrides: Partial<Parameters<typeof CategoryList>[0]> = {}) {
  const props = {
    categories,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isDeleting: false,
    ...overrides,
  };
  return { props, ...renderWithProviders(<CategoryList {...props} />) };
}

describe('CategoryList', () => {
  it('renders a row per category', () => {
    renderList();

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows a dash where a category has no description', () => {
    renderList();

    expect(screen.getByText('Food and supermarket')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('reports the category to edit', async () => {
    const { props, user } = renderList();
    const row = screen.getByText('Groceries').closest('tr')!;

    await user.click(within(row).getAllByRole('button')[0]);

    expect(props.onEdit).toHaveBeenCalledWith('category-1');
  });

  it('reports the category to delete', async () => {
    const { props, user } = renderList();
    const row = screen.getByText('Transport').closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    expect(props.onDelete).toHaveBeenCalledWith('category-2');
  });

  it('disables delete while a delete is in flight', () => {
    renderList({ isDeleting: true });
    const row = screen.getByText('Groceries').closest('tr')!;

    expect(within(row).getAllByRole('button')[1]).toBeDisabled();
  });
});
