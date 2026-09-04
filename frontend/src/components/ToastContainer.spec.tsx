import Button from '@mui/material/Button';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastContainer } from './ToastContainer';
import { useToast } from '../context/ToastContext';
import { act, fireEvent, renderWithProviders, screen } from '../test/utils';

function Trigger(): JSX.Element {
  const { addToast } = useToast();
  return (
    <>
      <Button onClick={() => addToast('Saved successfully', 'success')}>success</Button>
      <Button onClick={() => addToast('Something broke', 'error')}>error</Button>
      <Button onClick={() => addToast('Sticky notice', 'info', 0)}>sticky</Button>
    </>
  );
}

describe('ToastContainer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing until a toast is queued', () => {
    renderWithProviders(<ToastContainer />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a queued toast', async () => {
    const { user } = renderWithProviders(<Trigger />);

    await user.click(screen.getByRole('button', { name: 'success' }));

    expect(await screen.findByText('Saved successfully')).toBeInTheDocument();
  });

  it('stacks several toasts at once', async () => {
    const { user } = renderWithProviders(<Trigger />);

    await user.click(screen.getByRole('button', { name: 'success' }));
    await user.click(screen.getByRole('button', { name: 'error' }));

    expect(await screen.findByText('Saved successfully')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  // user-event drives its own timers, so this one clicks through fireEvent.
  it('removes a toast once its duration elapses', () => {
    vi.useFakeTimers();
    renderWithProviders(<Trigger />);

    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });

  it('keeps a toast with no duration on screen', async () => {
    const { user } = renderWithProviders(<Trigger />);

    await user.click(screen.getByRole('button', { name: 'sticky' }));

    expect(await screen.findByText('Sticky notice')).toBeInTheDocument();
  });
});
