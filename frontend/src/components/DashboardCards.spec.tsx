import { describe, expect, it } from 'vitest';
import { DashboardCards } from './DashboardCards';
import { makeDashboard } from '../test/fixtures';
import { renderWithProviders, screen } from '../test/utils';

const noDateRange = { startDate: '', endDate: '' };

describe('DashboardCards', () => {
  it('shows balance, income and expense totals as currency', () => {
    renderWithProviders(
      <DashboardCards
        data={makeDashboard({ balance: 1500, totalEntrada: 3000, totalSaida: 1500 })}
        dateRange={noDateRange}
      />
    );

    expect(screen.getByText('Current Balance')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('$1,500.00')).toHaveLength(2);
  });

  it('formats a negative balance rather than dropping the sign', () => {
    renderWithProviders(
      <DashboardCards data={makeDashboard({ balance: -250.5 })} dateRange={noDateRange} />
    );

    expect(screen.getByText('-$250.50')).toBeInTheDocument();
  });

  it('captions the totals with "All Time" when no dates are filtered', () => {
    renderWithProviders(<DashboardCards data={makeDashboard()} dateRange={noDateRange} />);

    expect(screen.getAllByText('All Time')).toHaveLength(3);
  });

  it('captions the totals with the selected range', () => {
    renderWithProviders(
      <DashboardCards
        data={makeDashboard()}
        dateRange={{ startDate: '2026-01-01', endDate: '2026-01-31' }}
      />
    );

    expect(screen.getAllByText('2026-01-01 to 2026-01-31')).toHaveLength(2);
  });

  it('fills in the open end of a half-specified range', () => {
    renderWithProviders(
      <DashboardCards data={makeDashboard()} dateRange={{ startDate: '2026-01-01', endDate: '' }} />
    );

    expect(screen.getAllByText('2026-01-01 to Today')).toHaveLength(2);
  });

  it('keeps the balance card on all time even when a range is selected', () => {
    renderWithProviders(
      <DashboardCards
        data={makeDashboard()}
        dateRange={{ startDate: '2026-01-01', endDate: '2026-01-31' }}
      />
    );

    expect(screen.getAllByText('All Time')).toHaveLength(1);
  });
});
