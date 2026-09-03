import type { DashboardSummary } from '../types';

interface TopCategoriesProps {
  categories: DashboardSummary['topCategories'];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function TopCategories({ categories }: TopCategoriesProps): JSX.Element {
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories by Outflow</h3>
        <p className="text-gray-500 text-center py-8">No expenses recorded in this period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Categories by Outflow</h3>

      <div className="space-y-4">
        {categories.map((category, index) => (
          <div key={category.categoryId} className="flex items-center">
            {/* Rank Badge */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-4 flex-shrink-0 ${
                index === 0
                  ? 'bg-yellow-500'
                  : index === 1
                    ? 'bg-gray-400'
                    : 'bg-orange-600'
              }`}
            >
              {index + 1}
            </div>

            {/* Category Info */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{category.categoryName}</p>
              <p className="text-xs text-gray-500">Outflow</p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className="text-lg font-semibold text-red-600">
                -{formatCurrency(category.totalOutflow)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bars */}
      {categories.length > 0 && (
        <div className="mt-6 space-y-3">
          {categories.map((category) => {
            const maxAmount = Math.max(...categories.map((c) => c.totalOutflow));
            const percentage = (category.totalOutflow / maxAmount) * 100;

            return (
              <div key={`${category.categoryId}-bar`}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-600">{category.categoryName}</span>
                  <span className="text-xs text-gray-600">{Math.round(percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
