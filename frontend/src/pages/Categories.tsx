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
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import { useCategories, useDeleteCategory } from '../hooks';
import { CategoryForm } from '../components/CategoryForm';
import { CategoryList } from '../components/CategoryList';

export function Categories(): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: categories = [], isLoading, error } = useCategories();
  const deleteMutation = useDeleteCategory();

  const handleCreateSuccess = (): void => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleDeleteClick = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Organize where your money goes.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          New Category
        </Button>
      </Box>

      <Dialog open={showForm} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle>
        <CategoryForm
          editingId={editingId}
          onSuccess={handleCreateSuccess}
          onCancel={handleCloseForm}
        />
      </Dialog>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load categories. Please try again.
        </Alert>
      )}

      {!isLoading && categories.length === 0 && (
        <Paper sx={{ textAlign: 'center', py: 8, borderStyle: 'dashed' }}>
          <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', mx: 'auto', mb: 1.5 }}>
            <SellOutlinedIcon fontSize="small" />
          </Avatar>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No categories yet
          </Typography>
          <Button onClick={() => setShowForm(true)}>Create your first category</Button>
        </Paper>
      )}

      {!isLoading && categories.length > 0 && (
        <CategoryList
          categories={categories}
          onEdit={(id) => {
            setEditingId(id);
            setShowForm(true);
          }}
          onDelete={handleDeleteClick}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </Box>
  );
}
