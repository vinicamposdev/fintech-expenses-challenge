import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { Category, Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US');
}

export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  isDeleting,
}: TransactionListProps): JSX.Element {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table size="medium">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => {
            const isIncome = transaction.type === 'ENTRADA';
            return (
              <TableRow key={transaction.id} hover>
                <TableCell sx={{ color: 'text.secondary' }}>
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{transaction.description}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>
                  {categoryNameById.get(transaction.categoryId) ?? 'Uncategorized'}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={
                      isIncome ? (
                        <ArrowUpwardIcon sx={{ fontSize: '14px !important' }} />
                      ) : (
                        <ArrowDownwardIcon sx={{ fontSize: '14px !important' }} />
                      )
                    }
                    label={isIncome ? 'Income' : 'Expense'}
                    color={isIncome ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={isIncome ? 'success.main' : 'error.main'}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => onEdit(transaction.id)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={isDeleting}
                      onClick={() => onDelete(transaction.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
