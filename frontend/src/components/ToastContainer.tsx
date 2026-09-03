import { useToasts } from '../context/ToastContext';

export function ToastContainer(): JSX.Element {
  const toasts = useToasts();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-md text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-green-600'
              : toast.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
