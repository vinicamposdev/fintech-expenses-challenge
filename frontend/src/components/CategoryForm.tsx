import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateCategory,
  useCategory,
  useUpdateCategory,
} from '../hooks';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  editingId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ editingId, onSuccess, onCancel }: CategoryFormProps): JSX.Element {
  const { data: existingCategory } = useCategory(editingId || '');
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error?.message || updateMutation.error?.message;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (editingId && existingCategory) {
      reset({
        name: existingCategory.name,
        description: existingCategory.description || '',
      });
    }
  }, [editingId, existingCategory, reset]);

  const onSubmit = async (data: CategoryFormData): Promise<void> => {
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
      // Error is displayed in the UI via mutation.error
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          placeholder="e.g., Alimentação"
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <input
          id="description"
          type="text"
          {...register('description')}
          placeholder="e.g., Expenses with food and groceries"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
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
