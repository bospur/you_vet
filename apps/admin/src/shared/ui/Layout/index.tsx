import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoIcon from '@mui/icons-material/Info';
import InsightsIcon from '@mui/icons-material/Insights';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../config/AuthContext';
import { useNotification } from '../Notification/NotificationContext';
import { styles, appBarSx, mainSx } from './styles';

const NAV_ITEMS = [
  { label: 'Обзор', to: '/dashboard', icon: <InsightsIcon />, roles: ['admin'] },
  { label: 'О клинике', to: '/clinic-info', icon: <InfoIcon />, roles: ['admin', 'editor'] },
  { label: 'Животные', to: '/animals', icon: <PetsIcon />, roles: ['admin', 'editor'] },
  { label: 'Статьи', to: '/articles', icon: <ArticleIcon />, roles: ['admin', 'editor'] },
  { label: 'Врачи', to: '/doctors', icon: <MedicalServicesIcon />, roles: ['admin', 'editor'] },
  { label: 'Расписание', to: '/schedule', icon: <CalendarMonthIcon />, roles: ['admin', 'editor'] },
  { label: 'Груминг', to: '/grooming', icon: <ContentCutIcon />, roles: ['admin', 'editor', 'groomer'] },
  { label: 'Запись · услуги', to: '/booking/services', icon: <EventAvailableIcon />, roles: ['admin', 'manager'] },
  { label: 'Запись · расписание', to: '/booking/schedule', icon: <CalendarMonthIcon />, roles: ['admin', 'manager'] },
  { label: 'Пользователи', to: '/users', icon: <PeopleIcon />, roles: ['admin'] },
];

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export function Layout({ children, title = 'VP Admin' }: LayoutProps) {
  const { logout, user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    notify('Вы вышли из системы', 'info');
    navigate('/login');
  };

  const drawerContent = (
    <>
      <Box sx={styles.drawerHeader}>
        <PetsIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary" fontWeight={700}>
          VP Admin
        </Typography>
      </Box>
      <List sx={{ pt: 1, flexGrow: 1 }}>
        {NAV_ITEMS.filter(({ roles }) => !user || roles.includes(user.role)).map(({ label, to, icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            sx={styles.navItem}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={styles.root}>
      {/* AppBar */}
      <AppBar position="fixed" sx={appBarSx(isMobile)} color="inherit">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              sx={{ mr: 1 }}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Tooltip title="Выйти">
            <IconButton onClick={handleLogout} color="default">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar — temporary на мобиле, permanent на десктопе */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ ...styles.drawer, display: { xs: 'block', md: 'none' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{ ...styles.drawer, display: { xs: 'none', md: 'block' } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box component="main" sx={mainSx(isMobile)}>
        {children}
      </Box>
    </Box>
  );
}
