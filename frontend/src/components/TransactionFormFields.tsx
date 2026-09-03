import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import type { Category } from '../types';

interface TransactionFormData {
  description: string;
  amount: number;
  type: 'ENTRADA' | 'SAIDA';
  categoryId: string;
  date: string;
}

interface TransactionFormFieldsProps {
  register: UseFormRegister<TransactionFormData>;
  errors: FieldErrors<TransactionFormData>;
  categories: Category[];
}

export function TransactionFormFields({
  register,
  errors,
  categories,
}: TransactionFormFieldsProps): JSX.Element {
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <TextField
          label="Description"
          fullWidth
          placeholder="e.g., Grocery shopping"
          slotProps={{ inputLabel: { shrink: true } }}
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Amount"
          type="number"
          fullWidth
          inputProps={{ step: '0.01' }}
          placeholder="0.00"
          slotProps={{ inputLabel: { shrink: true } }}
          {...register('amount', { valueAsNumber: true })}
          error={!!errors.amount}
          helperText={errors.amount?.message}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          label="Type"
          fullWidth
          defaultValue=""
          {...register('type')}
          error={!!errors.type}
          helperText={errors.type?.message}
        >
          <MenuItem value="">Select type</MenuItem>
          <MenuItem value="ENTRADA">Income</MenuItem>
          <MenuItem value="SAIDA">Expense</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          select
          label="Category"
          fullWidth
          defaultValue=""
          {...register('categoryId')}
          error={!!errors.categoryId}
          helperText={errors.categoryId?.message}
        >
          <MenuItem value="">Select category</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label="Date"
          type="date"
          fullWidth
          {...register('date')}
          error={!!errors.date}
          helperText={errors.date?.message}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
    </Grid>
  );
}
