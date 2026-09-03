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

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          id="description"
          type="text"
          {...register('description')}
          placeholder="e.g., Grocery shopping"
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            errors.description
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="type"
            {...register('type')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.type ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="">Select type</option>
            <option value="ENTRADA">Income</option>
            <option value="SAIDA">Expense</option>
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="categoryId"
            {...register('categoryId')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.categoryId
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            {...register('date')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              errors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>
      </div>

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
