import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import BooksManagement from './BooksManagement';
import OrdersManagement from './OrdersManagement';
import AdminLogin from './AdminLogin';
import { adminToken } from '../../lib/api';
import { colors } from '../../constants/tokens';

const CategoriesManagement = lazy(() => import('./CategoriesManagement'));
const AuthorsManagement = lazy(() => import('./AuthorsManagement'));
const ContactsManagement = lazy(() => import('./ContactsManagement'));
const SettingsManagement = lazy(() => import('./SettingsManagement'));
const TestimonialsManagement = lazy(() => import('./TestimonialsManagement'));
const TestAnalytics = lazy(() => import('./TestAnalytics'));
const TestsManagement = lazy(() => import('./TestsManagement'));
const UsersManagement = lazy(() => import('./UsersManagement'));
const SeoManagement = lazy(() => import('./SeoManagement'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
      <CircularProgress size={32} sx={{ color: colors.green }} />
    </Box>
  );
}

/**
 * Blocks the admin chrome from rendering at all without a token.
 *
 * The check used to live in an effect inside AdminLayout, so the full dashboard
 * painted for a frame — and fired its authenticated fetches — before redirecting.
 * `replace` keeps the guarded URL out of history so Back does not bounce.
 */
function RequireAuth() {
  const location = useLocation();
  if (!adminToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <AdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  );
}

export default function AdminIndex() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route element={<RequireAuth />}>
        <Route index element={<Dashboard />} />
        <Route path="books" element={<BooksManagement />} />
        <Route path="categories" element={<CategoriesManagement />} />
        <Route path="authors" element={<AuthorsManagement />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="contacts" element={<ContactsManagement />} />
        <Route path="tests" element={<TestsManagement />} />
        <Route path="test-results" element={<TestAnalytics />} />
        <Route path="testimonials" element={<TestimonialsManagement />} />
        <Route path="settings" element={<SettingsManagement />} />
        <Route path="seo" element={<SeoManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
