import { describe, expect, it, vi } from 'vitest';
import { useToast, useToasts } from './ToastContext';
import { act, renderHook } from '../test/utils';
import { ToastProvider } from './ToastContext';

function useToastPair() {
  return { ...useToast(), toasts: useToasts() };
}

const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  it('queues a toast with its message and severity', () => {
    const { result } = renderHook(useToastPair, { wrapper });

    act(() => result.current.addToast('Saved', 'success'));

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({ message: 'Saved', type: 'success' });
  });

  it('gives every toast its own id so they can stack', () => {
    const { result } = renderHook(useToastPair, { wrapper });

    act(() => result.current.addToast('One', 'info'));
    act(() => result.current.addToast('Two', 'info'));

    const [first, second] = result.current.toasts;
    expect(first.id).not.toBe(second.id);
  });

  it('removes a toast by id', () => {
    const { result } = renderHook(useToastPair, { wrapper });
    act(() => result.current.addToast('One', 'info'));
    const [{ id }] = result.current.toasts;

    act(() => result.current.removeToast(id));

    expect(result.current.toasts).toHaveLength(0);
  });

  it('expires a toast after its duration', () => {
    vi.useFakeTimers();
    const { result } = renderHook(useToastPair, { wrapper });

    act(() => result.current.addToast('One', 'info', 1000));
    expect(result.current.toasts).toHaveLength(1);

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('keeps a toast with duration 0 until it is dismissed', () => {
    vi.useFakeTimers();
    const { result } = renderHook(useToastPair, { wrapper });

    act(() => result.current.addToast('Sticky', 'info', 0));
    act(() => vi.advanceTimersByTime(60_000));

    expect(result.current.toasts).toHaveLength(1);
    vi.useRealTimers();
  });

  it('refuses to be used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider'
    );
    expect(() => renderHook(() => useToasts())).toThrow(
      'useToasts must be used within a ToastProvider'
    );

    vi.restoreAllMocks();
  });
});
