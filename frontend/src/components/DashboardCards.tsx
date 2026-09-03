import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import WalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
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

  const cards = [
    {
      label: 'Current Balance',
      value: data.balance,
      caption: 'All Time',
      icon: WalletIcon,
      color: 'primary.dark' as const,
      bg: 'primary.light' as const,
      valueColor: 'text.primary',
    },
    {
      label: 'Total Income',
      value: data.totalEntrada,
      caption: dateRangeText,
      icon: TrendingUpIcon,
      color: 'success.main' as const,
      bg: 'success.light' as const,
      valueColor: 'success.main',
    },
    {
      label: 'Total Expenses',
      value: data.totalSaida,
      caption: dateRangeText,
      icon: TrendingDownIcon,
      color: 'error.main' as const,
      bg: 'error.light' as const,
      valueColor: 'error.main',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Grid key={card.label} size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {card.label}
                  </Typography>
                  <Avatar
                    variant="rounded"
                    sx={{ width: 36, height: 36, bgcolor: card.bg, color: card.color }}
                  >
                    <Icon fontSize="small" />
                  </Avatar>
                </Box>
                <Typography variant="h5" fontWeight={700} color={card.valueColor}>
                  {formatCurrency(card.value)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.caption}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
