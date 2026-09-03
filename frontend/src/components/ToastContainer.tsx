import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useToasts } from '../context/ToastContext';

export function ToastContainer(): JSX.Element {
  const toasts = useToasts();

  return (
    <Stack
      spacing={1}
      sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1400, width: '100%', maxWidth: 360 }}
    >
      {toasts.map((toast) => (
        <Snackbar key={toast.id} open sx={{ position: 'static', transform: 'none' }}>
          <Alert severity={toast.type} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
