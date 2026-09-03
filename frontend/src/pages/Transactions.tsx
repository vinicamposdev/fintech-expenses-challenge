import { useState } from 'react';
import { useTransactions, useDeleteTransaction } from '../hooks';
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

  const handleDeleteClick = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            New Transaction
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <TransactionForm
            editingId={editingId}
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </div>
      )}

      <TransactionFilters filters={filters} onFilterChange={handleFilterChange} />

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-sm text-red-800">
            Failed to load transactions. Please try again.
          </div>
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No transactions found</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first transaction
          </button>
        </div>
      )}

      {!isLoading && (data?.data.length ?? 0) > 0 && (
        <>
          <TransactionList
            transactions={data!.data}
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
    </div>
  );
}
