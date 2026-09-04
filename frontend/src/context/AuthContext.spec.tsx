import { HttpResponse, http } from 'msw';
import Button from '@mui/material/Button';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from './AuthContext';
import { api } from '../test/handlers';
import { server } from '../test/server';
import { signIn, testToken, testUser } from '../test/fixtures';
import { renderHook, renderWithProviders, screen, waitFor } from '../test/utils';

function Session(): JSX.Element {
  const { user, error, login, register, logout } = useAuth();

  return (
    <div>
      <p data-testid="user">{user ? user.email : 'signed out'}</p>
      <p data-testid="error">{error ?? ''}</p>
      <Button onClick={() => void login('ada@example.com', 'secret123').catch(() => {})}>
        login
      </Button>
      <Button onClick={() => void login('ada@example.com', 'wrong-password').catch(() => {})}>
        bad login
      </Button>
      <Button
        onClick={() => void register('Ada', 'new@example.com', 'secret123').catch(() => {})}
      >
        register
      </Button>
      <Button onClick={logout}>logout</Button>
    </div>
  );
}

describe('AuthContext', () => {
  it('starts signed out with an empty store', () => {
    renderWithProviders(<Session />);

    expect(screen.getByTestId('user')).toHaveTextContent('signed out');
  });

  it('restores the session from localStorage on first render', () => {
    signIn();

    renderWithProviders(<Session />);

    expect(screen.getByTestId('user')).toHaveTextContent(testUser.email);
  });

  it('ignores a stored user that is not valid JSON, and clears it', () => {
    localStorage.setItem('accessToken', testToken);
    localStorage.setItem('user', '{oops');

    renderWithProviders(<Session />);

    expect(screen.getByTestId('user')).toHaveTextContent('signed out');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('ignores a stored user with no token', () => {
    localStorage.setItem('user', JSON.stringify(testUser));

    renderWithProviders(<Session />);

    expect(screen.getByTestId('user')).toHaveTextContent('signed out');
  });

  it('stores the token and user after a successful login', async () => {
    const { user: ui } = renderWithProviders(<Session />);

    await ui.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada@example.com'));
    expect(localStorage.getItem('accessToken')).toBe(testToken);
    expect(JSON.parse(localStorage.getItem('user')!)).toMatchObject({ email: 'ada@example.com' });
  });

  it('exposes the backend message when login fails and stores nothing', async () => {
    const { user: ui } = renderWithProviders(<Session />);

    await ui.click(screen.getByRole('button', { name: 'bad login' }));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
    );
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('falls back to a generic message when the API sends none', async () => {
    server.use(http.post(api('/auth/login'), () => new HttpResponse(null, { status: 500 })));
    const { user: ui } = renderWithProviders(<Session />);

    await ui.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to login. Please try again.')
    );
  });

  it('signs the user in straight after registering', async () => {
    const { user: ui } = renderWithProviders(<Session />);

    await ui.click(screen.getByRole('button', { name: 'register' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('new@example.com'));
    expect(localStorage.getItem('accessToken')).toBe(testToken);
  });

  it('clears the stored session on logout', async () => {
    signIn();
    const { user: ui } = renderWithProviders(<Session />);

    await ui.click(screen.getByRole('button', { name: 'logout' }));

    expect(screen.getByTestId('user')).toHaveTextContent('signed out');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('drops cached queries on logout so the next user sees no stale data', async () => {
    signIn();
    const { user: ui, queryClient } = renderWithProviders(<Session />);
    queryClient.setQueryData(['transactions'], { data: [] });

    await ui.click(screen.getByRole('button', { name: 'logout' }));

    expect(queryClient.getQueryData(['transactions'])).toBeUndefined();
  });

  it('drops cached queries on login for the same reason', async () => {
    const { user: ui, queryClient } = renderWithProviders(<Session />);
    queryClient.setQueryData(['transactions'], { data: [] });

    await ui.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(queryClient.getQueryData(['transactions'])).toBeUndefined());
  });

  it('refuses to be used outside the provider', () => {
    // React logs the thrown render error; the assertion is on the throw itself.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    vi.restoreAllMocks();
  });
});
