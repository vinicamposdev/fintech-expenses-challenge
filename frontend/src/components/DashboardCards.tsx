import type { DashboardSummary } from '../types';

interface DashboardCardsProps {
  data: DashboardSummary;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function DashboardCards({ data, dateRange }: DashboardCardsProps): JSX.Element {
  const dateRangeText =
    dateRange.startDate || dateRange.endDate
      ? `${dateRange.startDate || 'Start'} to ${dateRange.endDate || 'Today'}`
      : 'All Time';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
        <h3 className="text-sm font-medium text-blue-600 mb-2">Current Balance</h3>
        <p className="text-3xl font-bold text-blue-900">{formatCurrency(data.balance)}</p>
        <p className="text-xs text-blue-600 mt-2">All Time</p>
      </div>

      {/* Income Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
        <h3 className="text-sm font-medium text-green-600 mb-2">Total Income</h3>
        <p className="text-3xl font-bold text-green-900">{formatCurrency(data.totalEntrada)}</p>
        <p className="text-xs text-green-600 mt-2">{dateRangeText}</p>
      </div>

      {/* Expense Card */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 p-6">
        <h3 className="text-sm font-medium text-red-600 mb-2">Total Expenses</h3>
        <p className="text-3xl font-bold text-red-900">{formatCurrency(data.totalSaida)}</p>
        <p className="text-xs text-red-600 mt-2">{dateRangeText}</p>
      </div>
    </div>
  );
}
