import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { adminRequest } from '../../lib/api';

/* ─── 3D TILT STAT CARD WITH RADIAL CURSOR SPOTLIGHT ───────────────────────── */
function StatCard({ icon: Icon, title, value, color, badgeText, loading, delay = 0 }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-100, 100], [8, -8]), { stiffness: 250, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-8, 8]), { stiffness: 250, damping: 25 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] shadow-xl"
      >
        {/* Radial spotlight effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}25, transparent 40%)`,
          }}
        />

        <div className="relative z-10 flex items-start justify-between">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
          >
            <Icon sx={{ fontSize: 30 }} />
          </div>
          {badgeText && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold tracking-wider uppercase border"
              style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}
            >
              <TrendingUpIcon sx={{ fontSize: 12 }} />
              {badgeText}
            </span>
          )}
        </div>

        <div className="relative z-10 mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-white/60">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 rounded-lg bg-white/10 animate-pulse" />
          ) : (
            <h3 className="mt-1 font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-white tracking-tight">
              {value}
            </h3>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── MAIN DASHBOARD ──────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    adminRequest('/api/orders/admin/stats')
      .then((data) => { if (!cancelled) { setStats(data); setError(null); } })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard statistics');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const quickActions = [
    { label: 'Manage Books Catalog', desc: 'Add, edit, or update publications & pricing', path: '/admin/books', color: '#10b981', icon: MenuBookIcon },
    { label: 'Inspect Orders', desc: 'Review orders, payment statuses & fulfillment', path: '/admin/orders', color: '#3b82f6', icon: ShoppingCartIcon },
    { label: 'Categories & Taxonomy', desc: 'Structure book collections & stream tags', path: '/admin/categories', color: '#e8b86d', icon: AutoAwesomeIcon },
    { label: 'System Settings', desc: 'Configure WhatsApp, phone, email & brand rules', path: '/admin/settings', color: '#96cead', icon: CheckCircleOutlineIcon },
  ];

  return (
    <div className="space-y-10 text-white">

      {/* ─── Hero Overview Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8b86d]/40 bg-[#e8b86d]/15 px-3.5 py-1 text-xs font-semibold text-[#f5d9a0] mb-3">
              <AutoAwesomeIcon sx={{ fontSize: 14 }} /> Real-Time Analytics Dashboard
            </div>
            <h1 className="font-['DM_Serif_Display',Georgia,serif] text-3xl sm:text-4xl text-white">
              Platform Control Center
            </h1>
            <p className="text-sm text-white/70 mt-1.5 max-w-xl">
              Welcome back to Paavan Setu's administrative console. Monitor book inventory, orders, customer contacts, and assessment statistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/orders"
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold text-[#071d12] no-underline shadow-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(120deg, #f7e6bd 0%, #e8b86d 100%)' }}
            >
              <ShoppingCartIcon fontSize="small" /> Review Recent Orders
            </Link>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-sm font-medium">
          ⚠️ {error} — Ensure backend API server and MongoDB database are active.
        </motion.div>
      )}

      {/* ─── 3D Metric Bento Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={MenuBookIcon}
          title="Total Books"
          value={stats?.totalBooks ?? 0}
          color="#10b981"
          badgeText="Active Catalog"
          loading={loading}
          delay={0.1}
        />
        <StatCard
          icon={ShoppingCartIcon}
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          color="#3b82f6"
          badgeText="Lifetime"
          loading={loading}
          delay={0.2}
        />
        <StatCard
          icon={AttachMoneyIcon}
          title="Revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
          color="#e8b86d"
          badgeText="Processed"
          loading={loading}
          delay={0.3}
        />
        <StatCard
          icon={PendingActionsIcon}
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          color="#f43f5e"
          badgeText="Requires Action"
          loading={loading}
          delay={0.4}
        />
      </div>

      {/* ─── Quick Actions & Management Shortcuts ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-white">Management Shortcuts</h3>
            <p className="text-xs text-white/60 mt-1">Direct access to primary administrative workflows.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Link
                  to={action.path}
                  className="group flex flex-col justify-between h-full rounded-2xl border border-white/10 bg-white/[0.05] p-6 no-underline transition-all duration-300 hover:border-white/25 hover:bg-white/[0.09]"
                >
                  <div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${action.color}20`, color: action.color, border: `1px solid ${action.color}40` }}
                    >
                      <Icon fontSize="medium" />
                    </div>
                    <h4 className="font-bold text-base text-white group-hover:text-[#e8b86d] transition-colors">{action.label}</h4>
                    <p className="text-xs text-white/60 mt-1.5 leading-relaxed">{action.desc}</p>
                  </div>

                  <div className="mt-6 flex items-center gap-1 text-xs font-bold" style={{ color: action.color }}>
                    <span>Open Module</span>
                    <ArrowForwardIcon fontSize="inherit" className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
