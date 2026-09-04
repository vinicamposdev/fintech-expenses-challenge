import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { CategoryForm } from './CategoryForm';
import { api } from '../test/handlers';
import { makeCategory } from '../test/fixtures';
import { server } from '../test/server';
import { renderWithProviders, screen, waitFor, within } from '../test/utils';

function renderForm(editingId: string | null = null) {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  return {
    onSuccess,
    onCancel,
    ...renderWithProviders(
      <CategoryForm editingId={editingId} onSuccess={onSuccess} onCancel={onCancel} />
    ),
  };
}

describe('CategoryForm', () => {
  it('requires a name', async () => {
    const { user, onSuccess } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('rejects a one-character name', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText(/name/i), 'A');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
  });

  it('creates a category and reports success', async () => {
    let payload: unknown;
    server.use(
      http.post(api('/categories'), async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ data: makeCategory() }, { status: 201 });
      })
    );
    const { user, onSuccess } = renderForm();

    await user.type(screen.getByLabelText(/name/i), 'Utilities');
    await user.type(screen.getByLabelText(/description/i), 'Power and water');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(payload).toEqual({ name: 'Utilities', description: 'Power and water' });
  });

  it('prefills the fields of the category being edited', async () => {
    renderForm('category-1');

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Groceries');
    });
    expect(screen.getByLabelText(/description/i)).toHaveValue('Food and supermarket');
  });

  it('updates instead of creating when editing', async () => {
    let method = '';
    server.use(
      http.patch(api('/categories/:id'), async ({ request }) => {
        method = request.method;
        return HttpResponse.json({ data: makeCategory({ name: 'Food' }) });
      })
    );
    const { user, onSuccess } = renderForm('category-1');

    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue('Groceries'));
    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), 'Food');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(method).toBe('PATCH');
  });

  it('keeps the dialog open and shows the error when the API rejects the save', async () => {
    server.use(
      http.post(api('/categories'), () =>
        HttpResponse.json({ message: 'Category already exists' }, { status: 400 })
      )
    );
    const { user, onSuccess } = renderForm();

    await user.type(screen.getByLabelText(/name/i), 'Groceries');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    // The toast renders an alert too, so this one is scoped to the form.
    const form = screen.getByRole('button', { name: 'Create' }).closest('form')!;
    await waitFor(() => expect(within(form).getByRole('alert')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { user, onCancel } = renderForm();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
