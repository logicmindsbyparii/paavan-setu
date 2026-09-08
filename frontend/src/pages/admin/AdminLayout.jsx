import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, 
  Typography, AppBar, Toolbar, IconButton, Avatar, 
  Divider, useMediaQuery, useTheme, Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmailIcon from '@mui/icons-material/Email';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShieldIcon from '@mui/icons-material/Shield';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../../constants/tokens';

const DRAWER_WIDTH = 270;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Books', icon: <MenuBookIcon />, path: '/admin/books' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories' },
  { text: 'Authors', icon: <PersonIcon />, path: '/admin/authors' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/admin/orders' },
  { text: 'Contacts', icon: <EmailIcon />, path: '/admin/contacts' },
  { text: 'Manage Tests', icon: <AssignmentIcon />, path: '/admin/tests' },
  { text: 'Test Results', icon: <AssessmentIcon />, path: '/admin/test-results' },
  { text: 'Testimonials', icon: <RecordVoiceOverIcon />, path: '/admin/testimonials' },
  { text: 'SEO Settings', icon: <SettingsIcon />, path: '/admin/seo' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];



export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (!storedAdmin) return;
    try {
      setAdmin(JSON.parse(storedAdmin));
    } catch {
      localStorage.removeItem('admin');
    }
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const currentSection =
    navItems.find((item) => item.path === location.pathname)?.text || 'Admin Overview';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: '#041008',
      color: colors.white,
      overflow: 'hidden',
    }}>

      {/* Brand Header */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
      }}>
        <Box className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8b86d] to-[#d9ae3c] text-[#071d12] font-bold shadow-lg">
            <ShieldIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <Typography sx={{ 
              fontWeight: 800, 
              fontSize: '1.05rem',
              color: '#f5d9a0',
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.1,
            }}>
              Paavan Setu
            </Typography>
            <Typography sx={{ 
              fontSize: '0.65rem', 
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              mt: 0.3,
            }}>
              Management Hub
            </Typography>
          </div>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: colors.white }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <List component="nav" aria-label="Admin sections" sx={{ 
        px: 2, 
        py: 2, 
        flexGrow: 1, 
        overflowY: 'auto', 
        position: 'relative', 
        zIndex: 10,
        minHeight: 0,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(232, 184, 109, 0.3)', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(232, 184, 109, 0.5)' },
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div key={item.text} whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <ListItem
                component={Link}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  py: 1,
                  px: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: isActive ? 'rgba(232, 184, 109, 0.08)' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(232, 184, 109, 0.12)' : 'rgba(255,255,255,0.04)',
                  },
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAdminPill"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#e8b86d] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <ListItemIcon sx={{ 
                  color: isActive ? '#f5d9a0' : 'rgba(255,255,255,0.65)',
                  minWidth: 38,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  }}
                />
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      {/* Footer Profile & Logout */}
      <Box sx={{ p: 2.5, flexShrink: 0, position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2.5">
            <Avatar sx={{ bgcolor: '#e8b86d', color: '#071d12', width: 34, height: 34, fontWeight: 'bold', fontSize: '0.85rem' }}>
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-[0.65rem] text-[#96cead] font-semibold truncate">{admin?.email || 'admin@paavansetu.com'}</p>
            </div>
          </div>
        </div>

        <ListItem
          component="button"
          type="button"
          onClick={handleLogout}
          sx={{
            width: '100%',
            border: '1px solid transparent',
            background: 'transparent',
            borderRadius: '10px',
            cursor: 'pointer',
            py: 1,
            px: 2,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#ef4444', minWidth: 34 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Sign Out"
            primaryTypographyProps={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#fca5a5',
            }}
          />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: '#04140a', color: colors.white }}>
      {/* Sidebar Drawer */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH, borderRight: '1px solid rgba(255,255,255,0.1)' } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Box sx={{ 
          width: DRAWER_WIDTH, 
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          borderRight: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          zIndex: 40,
        }}>
          {drawer}
        </Box>
      )}

      {/* Main Container */}
      <Box sx={{
        flexGrow: 1,
        minWidth: 0,
        ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: '#06160d',
      }}>
        {/* Top Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(4, 20, 10, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: colors.white,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 30,
          }}
        >
          <Toolbar className="justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <IconButton
                  edge="start"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                  sx={{ color: '#e8b86d' }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              <div>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  {currentSection}
                </Typography>
                <div className="hidden sm:flex items-center gap-2 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[0.68rem] text-white/60 font-semibold tracking-wider uppercase">System Operational</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs text-white/80">
                <AutoAwesomeIcon sx={{ fontSize: 14, color: '#e8b86d' }} />
                <span>Control Center</span>
              </div>

              <Tooltip title={admin?.name || 'Admin Profile'}>
                <Avatar sx={{
                  bgcolor: 'linear-gradient(135deg, #e8b86d, #d9ae3c)',
                  color: '#071d12',
                  width: 38,
                  height: 38,
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  border: '2px solid rgba(232, 184, 109, 0.4)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                }}>
                  {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
              </Tooltip>
            </div>
          </Toolbar>
        </AppBar>

        {/* Dynamic Page Outlet Container */}
        <Box component="main" sx={{ p: { xs: 2.5, md: 4 }, flexGrow: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}
