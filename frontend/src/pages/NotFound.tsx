import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';

export function NotFound(): JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.light', color: 'primary.dark', mb: 3 }}>
        <ExploreOutlinedIcon />
      </Avatar>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 360 }}>
        The page you're looking for doesn't exist. It might have been moved or deleted.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Go to Dashboard
      </Button>
    </Box>
  );
}
