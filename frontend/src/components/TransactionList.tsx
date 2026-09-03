import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
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
  onEdit,
  onDelete,
  isDeleting,
}: TransactionListProps): JSX.Element {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{formatDate(transaction.date)}</td>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                {transaction.description}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {/* Category name is not in Transaction, only categoryId */}
                {transaction.categoryId}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    transaction.type === 'ENTRADA'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {transaction.type === 'ENTRADA' ? 'Income' : 'Expense'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">
                <span
                  className={
                    transaction.type === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {transaction.type === 'ENTRADA' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(transaction.id)}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(transaction.id)}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
