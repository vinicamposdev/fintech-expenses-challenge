import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';
import { signIn } from '../test/fixtures';
import { renderWithProviders, screen, within } from '../test/utils';

function renderLayout(route = '/') {
  signIn();
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route element={<Layout />}>
        <Route path="/" element={<p>Dashboard page</p>} />
        <Route path="/transactions" element={<p>Transactions page</p>} />
        <Route path="/categories" element={<p>Categories page</p>} />
      </Route>
    </Routes>,
    { route }
  );
}

/** The sidebar and the mobile top bar both render the nav, so links come in pairs. */
function sidebarLink(name: RegExp): HTMLElement {
  return within(document.querySelector('.MuiDrawer-root')!).getByRole('link', { name });
}

describe('Layout', () => {
  it('renders the routed page inside the shell', () => {
    renderLayout();

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    expect(screen.getAllByText('Fintech Expenses').length).toBeGreaterThan(0);
  });

  it('links to every section', () => {
    renderLayout();

    expect(sidebarLink(/dashboard/i)).toHaveAttribute('href', '/');
    expect(sidebarLink(/transactions/i)).toHaveAttribute('href', '/transactions');
    expect(sidebarLink(/categories/i)).toHaveAttribute('href', '/categories');
  });

  it('navigates between sections', async () => {
    const { user } = renderLayout();

    await user.click(sidebarLink(/transactions/i));

    expect(screen.getByText('Transactions page')).toBeInTheDocument();
  });

  it('marks the current section as selected', () => {
    renderLayout('/categories');

    expect(sidebarLink(/categories/i)).toHaveClass('Mui-selected');
    expect(sidebarLink(/dashboard/i)).not.toHaveClass('Mui-selected');
  });

  it('logs out and returns to the login page', async () => {
    const { user } = renderLayout();

    await user.click(within(document.querySelector('.MuiDrawer-root')!).getByText('Logout'));

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
