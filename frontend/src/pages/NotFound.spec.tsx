import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFound } from './NotFound';
import { renderWithProviders, screen } from '../test/utils';

describe('NotFound page', () => {
  it('explains that the page does not exist', () => {
    renderWithProviders(<NotFound />);

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('offers a way back to the dashboard', async () => {
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/nope" element={<NotFound />} />
        <Route path="/" element={<p>Dashboard page</p>} />
      </Routes>,
      { route: '/nope' }
    );

    await user.click(screen.getByRole('link', { name: /go to dashboard/i }));

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });
});
