import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { Categories } from './Categories';
import { api } from '../test/handlers';
import { makeCategory } from '../test/fixtures';
import { server } from '../test/server';
import { renderWithProviders, screen, waitFor, within } from '../test/utils';

describe('Categories page', () => {
  it('lists the categories once loaded', async () => {
    renderWithProviders(<Categories />);

    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('shows an error when the list fails to load', async () => {
    server.use(http.get(api('/categories'), () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(<Categories />);

    expect(
      await screen.findByText('Failed to load categories. Please try again.')
    ).toBeInTheDocument();
  });

  it('offers a first-category prompt when there are none', async () => {
    server.use(http.get(api('/categories'), () => HttpResponse.json({ data: [] })));

    renderWithProviders(<Categories />);

    expect(await screen.findByText('No categories yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first category/i })).toBeInTheDocument();
  });

  it('opens the create dialog from the empty state', async () => {
    server.use(http.get(api('/categories'), () => HttpResponse.json({ data: [] })));
    const { user } = renderWithProviders(<Categories />);

    await user.click(await screen.findByRole('button', { name: /create your first category/i }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('New Category');
  });

  it('creates a category and closes the dialog', async () => {
    const { user } = renderWithProviders(<Categories />);
    await screen.findByText('Groceries');

    await user.click(screen.getByRole('button', { name: /new category/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/name/i), 'Utilities');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the edit dialog prefilled with the chosen category', async () => {
    const { user } = renderWithProviders(<Categories />);
    const row = (await screen.findByText('Groceries')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[0]);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Edit Category');
    await waitFor(() => expect(within(dialog).getByLabelText(/name/i)).toHaveValue('Groceries'));
  });

  it('asks for confirmation before deleting', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    let deleted = false;
    server.use(
      http.delete(api('/categories/:id'), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { user } = renderWithProviders(<Categories />);
    const row = (await screen.findByText('Groceries')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    expect(confirm).toHaveBeenCalled();
    expect(deleted).toBe(false);
    confirm.mockRestore();
  });

  it('deletes the category once confirmed and refreshes the list', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let remaining = [makeCategory(), makeCategory({ id: 'category-2', name: 'Transport' })];
    server.use(
      http.get(api('/categories'), () => HttpResponse.json({ data: remaining })),
      http.delete(api('/categories/:id'), ({ params }) => {
        remaining = remaining.filter((category) => category.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { user } = renderWithProviders(<Categories />);
    const row = (await screen.findByText('Groceries')).closest('tr')!;

    await user.click(within(row).getAllByRole('button')[1]);

    await waitFor(() => expect(screen.queryByText('Groceries')).not.toBeInTheDocument());
    expect(screen.getByText('Transport')).toBeInTheDocument();
    confirm.mockRestore();
  });

  it('closes the dialog without saving on cancel', async () => {
    const { user } = renderWithProviders(<Categories />);
    await screen.findByText('Groceries');

    await user.click(screen.getByRole('button', { name: /new category/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
