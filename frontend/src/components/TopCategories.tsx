import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutlined';
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

const rankColors = ['#eab308', '#a8a29e', '#f97316'];

export function TopCategories({ categories }: TopCategoriesProps): JSX.Element {
  if (categories.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Top Categories by Outflow
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', mb: 1.5 }}>
              <PieChartOutlineIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              No expenses recorded in this period
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const maxAmount = Math.max(...categories.map((c) => c.totalOutflow));

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>
          Top Categories by Outflow
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {categories.map((category, index) => {
            const percentage = (category.totalOutflow / maxAmount) * 100;
            return (
              <Box key={category.categoryId}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 13,
                      fontWeight: 700,
                      bgcolor: rankColors[index] ?? rankColors[2],
                      color: '#fff',
                    }}
                  >
                    {index + 1}
                  </Avatar>
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1 }}>
                    {category.categoryName}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">
                    -{formatCurrency(category.totalOutflow)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    ml: 4.75,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.100',
                    '& .MuiLinearProgress-bar': { bgcolor: 'error.main', borderRadius: 3 },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
