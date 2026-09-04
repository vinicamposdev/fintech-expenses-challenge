import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../lib/errors';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login(): JSX.Element {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      setApiError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Login failed. Please try again.'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            variant="rounded"
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mx: 'auto', mb: 2 }}
          >
            <WalletIcon fontSize="small" />
          </Avatar>
          <Typography variant="h5" fontWeight={700}>
            Sign in to your account
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2.5}>
              {apiError && <Alert severity="error">{apiError}</Alert>}

              <TextField
                label="Email address"
                type="email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <Typography variant="body2" color="text.secondary" textAlign="center">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" fontWeight={600}>
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
