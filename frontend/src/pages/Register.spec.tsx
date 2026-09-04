import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Register } from './Register';
import { api } from '../test/handlers';
import { server } from '../test/server';
import { testToken } from '../test/fixtures';
import { renderWithProviders, screen } from '../test/utils';

function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<p>Dashboard page</p>} />
      <Route path="/login" element={<p>Login page</p>} />
    </Routes>,
    { route: '/register' }
  );
}

async function fillForm(
  user: ReturnType<typeof renderRegister>['user'],
  email = 'new@example.com',
  password = 'secret123',
  confirmPassword = password
): Promise<void> {
  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), confirmPassword);
}

describe('Register page', () => {
  it('renders the sign-up form', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  it('rejects a short name', async () => {
    const { user } = renderRegister();

    await user.type(screen.getByLabelText(/full name/i), 'A');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
  });

  it('rejects a short password', async () => {
    const { user } = renderRegister();

    await fillForm(user, 'new@example.com', '123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(
      (await screen.findAllByText('Password must be at least 6 characters')).length
    ).toBeGreaterThan(0);
  });

  it('rejects mismatched passwords', async () => {
    const { user } = renderRegister();

    await fillForm(user, 'new@example.com', 'secret123', 'secret124');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
  });

  it('registers and lands on the dashboard already signed in', async () => {
    const { user } = renderRegister();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe(testToken);
  });

  it('points a taken email at the email field and offers signing in', async () => {
    const { user } = renderRegister();

    await fillForm(user, 'taken@example.com');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(
      await screen.findByText('This email is already registered. Try signing in instead.')
    ).toBeInTheDocument();
    // One link in the warning banner, one in the footer.
    expect(screen.getAllByRole('link', { name: /^sign in$/i })).toHaveLength(2);
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('shows a generic error for other API failures', async () => {
    server.use(
      http.post(api('/auth/register'), () =>
        HttpResponse.json({ message: 'Service unavailable' }, { status: 503 })
      )
    );
    const { user } = renderRegister();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
  });

  it('links to the login page', async () => {
    const { user } = renderRegister();

    await user.click(screen.getByRole('link', { name: /sign in/i }));

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
