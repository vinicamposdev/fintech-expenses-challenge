import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import {
  useCreateTransaction,
  useTransaction,
  useUpdateTransaction,
  useCategories,
} from '../hooks';
import { TransactionFormFields } from './TransactionFormFields';

const transactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .min(2, 'Description must be at least 2 characters'),
  amount: z.number().positive('Amount must be greater than 0'),
  type: z.enum(['ENTRADA', 'SAIDA'], {
    errorMap: () => ({ message: 'Type must be ENTRADA or SAIDA' }),
  }),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  editingId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({
  editingId,
  onSuccess,
  onCancel,
}: TransactionFormProps): JSX.Element {
  const { data: existingTransaction } = useTransaction(editingId || '');
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error?.message || updateMutation.error?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  const amountValue = watch('amount');

  useEffect(() => {
    if (editingId && existingTransaction) {
      reset({
        description: existingTransaction.description,
        amount: existingTransaction.amount,
        type: existingTransaction.type,
        categoryId: existingTransaction.categoryId,
        date: existingTransaction.date,
      });
    }
  }, [editingId, existingTransaction, reset]);

  const onSubmit = async (data: TransactionFormData): Promise<void> => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess();
    } catch {
      // Error is displayed via mutation.error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TransactionFormFields register={register} errors={errors} categories={categories} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || !amountValue}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isLoading ? (editingId ? 'Updating...' : 'Creating...') : editingId ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </form>
  );
}
