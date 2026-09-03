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
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) =>
              onFilterChange({
                type: e.target.value ? (e.target.value as 'ENTRADA' | 'SAIDA') : undefined,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="ENTRADA">Income</option>
            <option value="SAIDA">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.categoryId || ''}
            onChange={(e) =>
              onFilterChange({
                categoryId: e.target.value || undefined,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) =>
              onFilterChange({
                startDate: e.target.value || undefined,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) =>
              onFilterChange({
                endDate: e.target.value || undefined,
              })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() =>
              onFilterChange({
                type: undefined,
                categoryId: undefined,
                startDate: undefined,
                endDate: undefined,
              })
            }
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
