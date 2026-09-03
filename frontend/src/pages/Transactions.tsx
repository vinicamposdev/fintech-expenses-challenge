import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useTransactions, useDeleteTransaction, useCategories } from '../hooks';
import { TransactionForm } from '../components/TransactionForm';
import { TransactionFilters } from '../components/TransactionFilters';
import { TransactionList } from '../components/TransactionList';
import { Pagination } from '../components/Pagination';
import type { QueryTransactionsParams } from '../api/transactions';

export function Transactions(): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueryTransactionsParams>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useTransactions(filters);
  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const handleFilterChange = (newFilters: Partial<QueryTransactionsParams>): void => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to page 1 when filter changes
    }));
  };

  const handlePageChange = (page: number): void => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleCreateSuccess = (): void => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleDeleteClick = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track every inflow and outflow.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          New Transaction
        </Button>
      </Box>

      <Dialog open={showForm} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        <TransactionForm
          editingId={editingId}
          onSuccess={handleCreateSuccess}
          onCancel={handleCloseForm}
        />
      </Dialog>

      <TransactionFilters filters={filters} onFilterChange={handleFilterChange} />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load transactions. Please try again.
        </Alert>
      )}

      {!isLoading && data?.data.length === 0 && (
        <Paper sx={{ textAlign: 'center', py: 8, borderStyle: 'dashed' }}>
          <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', mx: 'auto', mb: 1.5 }}>
            <ReceiptLongOutlinedIcon fontSize="small" />
          </Avatar>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No transactions found
          </Typography>
          <Button onClick={() => setShowForm(true)}>Create your first transaction</Button>
        </Paper>
      )}

      {!isLoading && (data?.data.length ?? 0) > 0 && (
        <>
          <TransactionList
            transactions={data!.data}
            categories={categories}
            onEdit={(id) => {
              setEditingId(id);
              setShowForm(true);
            }}
            onDelete={handleDeleteClick}
            isDeleting={deleteMutation.isPending}
          />
          <Pagination meta={data!.meta} onPageChange={handlePageChange} />
        </>
      )}
    </Box>
  );
}
