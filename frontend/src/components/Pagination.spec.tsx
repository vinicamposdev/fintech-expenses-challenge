import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';
import { renderWithProviders, screen } from '../test/utils';

const meta = { total: 45, page: 2, limit: 10, totalPages: 5 };

describe('Pagination', () => {
  it('marks the current page as selected', () => {
    renderWithProviders(<Pagination meta={meta} onPageChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /page 2/i })).toHaveAttribute('aria-current', 'page');
  });

  it('renders one control per page', () => {
    renderWithProviders(<Pagination meta={meta} onPageChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go to page 6' })).not.toBeInTheDocument();
  });

  it('reports the page the user picked', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(<Pagination meta={meta} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Go to page 3' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('reports the next page from the arrow control', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(<Pagination meta={meta} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /go to next page/i }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
