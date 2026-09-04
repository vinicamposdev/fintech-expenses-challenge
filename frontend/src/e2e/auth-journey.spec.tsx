import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/app';
import { signIn, testToken } from '../test/fixtures';
import { screen, waitFor, within } from '../test/utils';

function drawer(): HTMLElement {
  return document.querySelector('.MuiDrawer-root') as HTMLElement;
}

describe('e2e: signing in and out', () => {
  it('sends a signed-out visitor from a protected page to login, then through to the dashboard', async () => {
    const { user, router } = renderApp('/transactions');

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(localStorage.getItem('accessToken')).toBe(testToken);
  });

  it('keeps the user on the login page when the credentials are wrong', async () => {
    const { user, router } = renderApp('/login');

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('registers a new account and lands on the dashboard signed in', async () => {
    const { user, router } = renderApp('/register');

    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('sends a returning user with a stored session straight to the dashboard', async () => {
    signIn();

    const { router } = renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('logs out, clears the session and blocks the protected pages again', async () => {
    signIn();
    const { user, router } = renderApp('/');
    await screen.findByRole('heading', { name: 'Dashboard' });

    await user.click(within(drawer()).getByText('Logout'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows the not-found page for an unknown route', async () => {
    signIn();

    renderApp('/nowhere');

    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
