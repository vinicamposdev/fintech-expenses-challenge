import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      <TransactionFormFields register={register} errors={errors} categories={categories} />

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || !amountValue}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (editingId ? 'Updating...' : 'Creating...') : editingId ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
