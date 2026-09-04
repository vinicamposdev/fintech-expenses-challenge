import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { signIn } from '../test/fixtures';
import { renderWithProviders, screen } from '../test/utils';

function renderRoutes(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<p>Dashboard page</p>} />
      </Route>
    </Routes>,
    { route }
  );
}

describe('ProtectedRoute', () => {
  it('renders the guarded route for a signed-in user', () => {
    signIn();

    renderRoutes('/');

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it('redirects to login when there is no session', () => {
    renderRoutes('/');

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
  });

  it('redirects when a token exists but the stored user is corrupt', () => {
    localStorage.setItem('accessToken', 'token');
    localStorage.setItem('user', 'not-json');

    renderRoutes('/');

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
