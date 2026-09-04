import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Login } from './Login';
import { api } from '../test/handlers';
import { server } from '../test/server';
import { testToken } from '../test/fixtures';
import { renderWithProviders, screen, waitFor } from '../test/utils';

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<p>Dashboard page</p>} />
      <Route path="/register" element={<p>Register page</p>} />
    </Routes>,
    { route: '/login' }
  );
}

describe('Login page', () => {
  it('renders the sign-in form', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('rejects a malformed email before calling the API', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('requires a password', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('signs in and lands on the dashboard', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe(testToken);
  });

  it('shows the backend message for bad credentials and stays put', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('keeps the typed email after a failed attempt', async () => {
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByText('Invalid credentials');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('ada@example.com');
  });

  it('reports a server failure without blaming the credentials', async () => {
    server.use(http.post(api('/auth/login'), () => new HttpResponse(null, { status: 500 })));
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Login failed. Please try again.')).toBeInTheDocument();
  });

  it('shows a pending state while the request is in flight', async () => {
    // The response is held open explicitly - a timeout would race the click.
    let release: () => void = () => {};
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(api('/auth/login'), async () => {
        await inFlight;
        return HttpResponse.json({ data: { accessToken: testToken, user: {} } });
      })
    );
    const { user } = renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();

    release();

    await waitFor(() => expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument());
  });

  it('links to registration', async () => {
    const { user } = renderLogin();

    await user.click(screen.getByRole('link', { name: /sign up/i }));

    expect(screen.getByText('Register page')).toBeInTheDocument();
  });
});
