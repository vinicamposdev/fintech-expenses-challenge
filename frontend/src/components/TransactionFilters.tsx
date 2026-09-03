import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TuneIcon from '@mui/icons-material/Tune';
import { useCategories } from '../hooks';
import type { QueryTransactionsParams } from '../api/transactions';

interface TransactionFiltersProps {
  filters: QueryTransactionsParams;
  onFilterChange: (filters: Partial<QueryTransactionsParams>) => void;
}

export function TransactionFilters({
  filters,
  onFilterChange,
}: TransactionFiltersProps): JSX.Element {
  const { data: categories = [] } = useCategories();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
          <TuneIcon fontSize="small" />
          <Typography variant="body2" fontWeight={500}>
            Filters
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              select
              label="Type"
              size="small"
              fullWidth
              value={filters.type || ''}
              onChange={(e) =>
                onFilterChange({
                  type: e.target.value ? (e.target.value as 'ENTRADA' | 'SAIDA') : undefined,
                })
              }
            >
              <MenuItem value="">All types</MenuItem>
              <MenuItem value="ENTRADA">Income</MenuItem>
              <MenuItem value="SAIDA">Expense</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              select
              label="Category"
              size="small"
              fullWidth
              value={filters.categoryId || ''}
              onChange={(e) => onFilterChange({ categoryId: e.target.value || undefined })}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2.4 }}>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              sx={{ height: 40 }}
              onClick={() =>
                onFilterChange({
                  type: undefined,
                  categoryId: undefined,
                  startDate: undefined,
                  endDate: undefined,
                })
              }
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
