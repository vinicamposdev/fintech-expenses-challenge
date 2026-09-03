import type { PaginatedResponse } from '../types';

interface PaginationProps {
  meta: PaginatedResponse<unknown>['meta'];
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps): JSX.Element {
  const { page, totalPages } = meta;

  const pages = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push('...');
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {pages.map((p, idx) => (
        <button
          key={idx}
          onClick={() => typeof p === 'number' && onPageChange(p)}
          disabled={typeof p === 'string'}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            p === page
              ? 'bg-blue-600 text-white'
              : typeof p === 'number'
                ? 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                : 'text-gray-700 cursor-default'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
