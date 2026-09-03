import Box from '@mui/material/Box';
import MuiPagination from '@mui/material/Pagination';
import type { PaginatedResponse } from '../types';

interface PaginationProps {
  meta: PaginatedResponse<unknown>['meta'];
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps): JSX.Element {
  const { page, totalPages } = meta;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <MuiPagination
        page={page}
        count={totalPages}
        onChange={(_, value) => onPageChange(value)}
        shape="rounded"
        color="primary"
      />
    </Box>
  );
}
