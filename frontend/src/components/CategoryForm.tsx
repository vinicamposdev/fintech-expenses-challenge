import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { useCreateCategory, useCategory, useUpdateCategory } from '../hooks';

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
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Name"
            fullWidth
            autoFocus
            placeholder="e.g., Alimentação"
            slotProps={{ inputLabel: { shrink: true } }}
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            placeholder="e.g., Expenses with food and groceries"
            slotProps={{ inputLabel: { shrink: true } }}
            {...register('description')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isLoading ? (editingId ? 'Updating...' : 'Creating...') : editingId ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </form>
  );
}
