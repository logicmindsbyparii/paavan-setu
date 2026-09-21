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
  { text: 'Coupon Codes', icon: <AutoAwesomeIcon />, path: '/admin/coupons' },
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
    <div className="h-full flex flex-col relative bg-[#fcfcfc] text-[#111d11] overflow-hidden">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-gray-200 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8e6c9] to-[#a5d6a7] text-[#111d11] font-bold shadow-sm">
            <ShieldIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <Typography sx={{ 
              fontWeight: 800, 
              fontSize: '1.05rem',
              color: '#111d11',
              fontFamily: "'DM Serif Display', Georgia, serif",
              lineHeight: 1.1,
            }}>
              Paavan Setu
            </Typography>
            <Typography sx={{ 
              fontSize: '0.65rem', 
              color: '#4b5563',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              mt: 0.3,
            }}>
              Management Hub
            </Typography>
          </div>
        </div>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#111d11' }}>
            <CloseIcon />
          </IconButton>
        )}
      </div>

      {/* Navigation */}
      <List component="nav" aria-label="Admin sections" sx={{ 
        px: 2, 
        py: 2, 
        flexGrow: 1, 
        overflowY: 'auto', 
        position: 'relative', 
        zIndex: 10,
        minHeight: 0,
      }}
      className="scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div key={item.text} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <ListItem
                component={Link}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                sx={{
                  borderRadius: '10px',
                  mb: 0.5,
                  py: 1.2,
                  px: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: isActive ? '#f0fdf4' : 'transparent',
                  transition: 'all 0.2s ease-out',
                  '&:hover': {
                    bgcolor: isActive ? '#f0fdf4' : '#f9fafb',
                  },
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAdminPill"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-[#10b981] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <ListItemIcon sx={{ 
                  color: isActive ? '#10b981' : '#6b7280',
                  minWidth: 38,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#111d11' : '#4b5563',
                  }}
                />
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      {/* Footer Profile & Logout */}
      <div className="p-5 shrink-0 relative z-10 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <Avatar sx={{ bgcolor: '#e8f5e9', color: '#111d11', width: 36, height: 36, fontWeight: 'bold', fontSize: '0.9rem' }}>
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111d11] truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-xs text-[#6b7280] truncate">{admin?.email || 'admin@paavansetu.com'}</p>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 rounded-xl text-[#ef4444] hover:bg-red-50 transition-colors"
        >
          <LogoutIcon fontSize="small" className="mr-3" />
          <span className="text-sm font-semibold">Sign Out</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-white text-[#111d11]">
      {/* Sidebar Drawer */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH, borderRight: 'none', boxShadow: '1px 0 10px rgba(0,0,0,0.05)' } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <div className="w-[270px] shrink-0 fixed top-0 left-0 bottom-0 border-r border-gray-200 overflow-hidden z-40 bg-[#fcfcfc]">
          {drawer}
        </div>
      )}

      {/* Main Container */}
      <div className={`flex-grow min-w-0 flex flex-col min-h-[100dvh] bg-white ${isMobile ? '' : 'ml-[270px]'}`}>
        {/* Top Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#111d11',
            borderBottom: '1px solid #e5e7eb',
            zIndex: 30,
          }}
        >
          <Toolbar className="justify-between px-4 md:px-6 py-2">
            <div className="flex items-center gap-3">
              {isMobile && (
                <IconButton
                  edge="start"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                  sx={{ color: '#111d11' }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              <div>
                <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#111d11', fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  {currentSection}
                </Typography>
                <div className="hidden sm:flex items-center gap-2 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                  <span className="text-xs text-[#6b7280] font-medium tracking-wide">System Operational</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-medium text-[#4b5563]">
                <AutoAwesomeIcon sx={{ fontSize: 16, color: '#10b981' }} />
                <span>Control Center</span>
              </div>

              <Tooltip title={admin?.name || 'Admin Profile'}>
                <Avatar sx={{
                  bgcolor: '#e8f5e9',
                  color: '#111d11',
                  width: 40,
                  height: 40,
                  fontWeight: '600',
                  fontSize: '1rem',
                  border: '1px solid #c8e6c9',
                }}>
                  {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
              </Tooltip>
            </div>
          </Toolbar>
        </AppBar>

        {/* Dynamic Page Outlet Container */}
        <main className="flex-grow min-w-0 p-5 md:p-8">
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
        </main>
      </div>
    </div>
  );
}
