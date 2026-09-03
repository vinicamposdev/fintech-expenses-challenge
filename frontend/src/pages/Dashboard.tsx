import { useState } from 'react';
import { useDashboard } from '../hooks';
import { DashboardCards } from '../components/DashboardCards';
import { TopCategories } from '../components/TopCategories';
import type { QueryDashboardParams } from '../api/dashboard';

export function Dashboard(): JSX.Element {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const params: QueryDashboardParams = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const { data, isLoading, error } = useDashboard(params);

  const handleClearDates = (): void => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Date Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleClearDates}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-sm text-red-800">
            Failed to load dashboard. Please try again.
          </div>
        </div>
      )}

      {!isLoading && data && (
        <>
          <DashboardCards data={data} dateRange={{ startDate, endDate }} />
          <TopCategories categories={data.topCategories} />
        </>
      )}
    </div>
  );
}
