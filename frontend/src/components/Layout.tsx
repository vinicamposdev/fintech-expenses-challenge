import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SellIcon from '@mui/icons-material/SellOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';

const drawerWidth = 240;

const navItems = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon },
  { path: '/transactions', label: 'Transactions', icon: SwapHorizIcon },
  { path: '/categories', label: 'Categories', icon: SellIcon },
];

export function Layout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (): void => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const isActive = (path: string): boolean => location.pathname === path;

  const brand = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2 }}>
      <Avatar
        variant="rounded"
        sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 34, height: 34 }}
      >
        <WalletIcon fontSize="small" />
      </Avatar>
      <Typography variant="subtitle1" fontWeight={700} noWrap>
        Fintech Expenses
      </Typography>
    </Box>
  );

  const navList = (
    <List sx={{ px: 1.5, py: 1 }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={active}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark', color: 'primary.contrastText' },
                '.MuiListItemIcon-root': { color: 'inherit' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar (desktop) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{brand}</Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>{navList}</Box>
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Topbar (mobile) */}
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          display: { xs: 'block', md: 'none' },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              variant="rounded"
              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 30, height: 30 }}
            >
              <WalletIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle2" fontWeight={700}>
              Fintech Expenses
            </Typography>
          </Box>
          <IconButton onClick={handleLogout} size="small" aria-label="Logout">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
        <Box sx={{ display: 'flex', gap: 0.5, px: 1.5, pb: 1, overflowX: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={active}
                sx={{
                  borderRadius: 2,
                  width: 'auto',
                  px: 1.5,
                  py: 0.75,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 13, whiteSpace: 'nowrap' }}
                />
              </ListItemButton>
            );
          })}
        </Box>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 15, md: 0 },
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
