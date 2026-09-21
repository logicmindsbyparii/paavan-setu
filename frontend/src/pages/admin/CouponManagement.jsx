import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, TextField, Button, Grid, Card, CardContent, IconButton, InputAdornment, Switch, FormControlLabel, FormGroup, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, AutoAwesome as CouponIcon, Search as SearchIcon,
  Check as CheckIcon, Close as CloseIcon, FilterList as FilterListIcon, Sort as SortIcon
} from '@mui/icons-material';
import FormAlerts from '../../components/ui/FormAlerts';
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon, adminBulkUpdateCoupons, logApiFailure } from '../../lib/api';

const lightTextFieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--color-ink)',
    bgcolor: 'var(--color-snow)',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-green)', borderWidth: '2px' },
    '&.Mui-focused': { bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(10, 79, 34, 0.05)' }
  },
  '& .MuiInputLabel-root': { color: '#6b7280' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-ink)', fontWeight: 600 },
};

function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ code: '', description: '', maxUsage: 1, expiresAt: '' });
  
  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  const [editingId, setEditingId] = useState(null);
  const [bulkActivating, setBulkActivating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchCoupons = async () => {
    try {
      const data = await adminGetCoupons();
      setCoupons(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError('Failed to load coupons');
      logApiFailure('load coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) { setError('Coupon code is required'); return; }
    setError(''); setSuccess('');
    try {
      if (editingId) {
        await adminUpdateCoupon(editingId, {
          description: form.description,
          maxUsage: Number(form.maxUsage) || 1,
          expiresAt: form.expiresAt || null,
        });
        setSuccess('Coupon updated');
      } else {
        await adminCreateCoupon({
          code: form.code.toUpperCase().trim(),
          description: form.description,
          maxUsage: Number(form.maxUsage) || 1,
          expiresAt: form.expiresAt || null,
        });
        setSuccess('Coupon created');
      }
      setForm({ code: '', description: '', maxUsage: 1, expiresAt: '' });
      setEditingId(null);
      fetchCoupons();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      maxUsage: coupon.maxUsage || 1,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await adminDeleteCoupon(id);
      setSuccess('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleBulk = async (isActive) => {
    if (bulkActivating) return;
    if (selectedIds.length === 0) { setError('Select at least one coupon'); return; }
    setBulkActivating(true); setError(''); setSuccess('');
    try {
      await adminBulkUpdateCoupons(selectedIds, isActive);
      setSuccess(`${selectedIds.length} coupon(s) ${isActive ? 'activated' : 'deactivated'}`);
      setSelectedIds([]);
      fetchCoupons();
    } catch (err) {
      setError(err.message || 'Bulk operation failed');
    } finally {
      setBulkActivating(false);
    }
  };

  const filtered = useMemo(() => {
    let result = coupons;

    if (search.trim()) {
      const lowerQuery = search.toLowerCase();
      result = result.filter(c =>
        c.code.toLowerCase().includes(lowerQuery) ||
        (c.description || '').toLowerCase().includes(lowerQuery)
      );
    }

    if (statusFilter !== 'all') {
      const isActiveFilter = statusFilter === 'active';
      result = result.filter(c => c.isActive === isActiveFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortOrder) {
        case 'code_asc':
          return (a.code || '').localeCompare(b.code || '');
        case 'code_desc':
          return (b.code || '').localeCompare(a.code || '');
        case 'usage_desc':
          return (b.usedCount || 0) - (a.usedCount || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [coupons, search, statusFilter, sortOrder]);

  const handleToggleSelectAll = () => {
    if (filtered.length === 0) return;
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c._id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box className="space-y-6">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
          Coupon Code Management
        </Typography>
        <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
          Generate, manage, and track coupon codes for test retakes.
        </Typography>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      {/* Create / Edit form */}
      <Card sx={{ bgcolor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: '#111827', mb: 2, fontWeight: 700 }}>
            {editingId ? 'Edit Coupon' : 'Create New Coupon'}
          </Typography>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              label="Coupon Code"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              disabled={!!editingId}
              placeholder="e.g. RETAKE2024"
              className="col-span-2"
              sx={lightTextFieldStyle}
            />
            {!editingId && (
              <Button
                type="button"
                onClick={() => setForm({ ...form, code: generateCouponCode() })}
                variant="outlined"
                sx={{ borderColor: 'rgba(0,0,0,0.12)', color: '#6b7280', borderRadius: '12px', '&:hover': { borderColor: '#10b981', color: '#111827' } }}
              >
                Generate Random
              </Button>
            )}
            <TextField
              label="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              className="col-span-2"
              sx={lightTextFieldStyle}
            />
            <TextField
              label="Max Usage"
              type="number"
              value={form.maxUsage}
              onChange={e => setForm({ ...form, maxUsage: e.target.value })}
              inputProps={{ min: 1, max: 9999 }}
              sx={lightTextFieldStyle}
            />
            <TextField
              label="Expiry Date (optional)"
              type="date"
              value={form.expiresAt}
              onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={lightTextFieldStyle}
            />
            <Box className="flex items-end" sx={{ minHeight: 56 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{ background: 'linear-gradient(135deg, #f7e6ae 0%, #e9c85c 50%, #d9ae3c 100%)', color: '#051a0d', fontWeight: 700, px: 3 }}
              >
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  onClick={() => { setEditingId(null); setForm({ code: '', description: '', maxUsage: 1, expiresAt: '' }); setError(''); }}
                  variant="outlined"
                  sx={{ borderColor: 'rgba(0,0,0,0.12)', color: '#6b7280', ml: 1, '&:hover': { borderColor: '#10b981', color: '#111827' } }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Filter, Sort, and Bulk Actions Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search codes or descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              ...lightTextFieldStyle,
              minWidth: { xs: '100%', md: '300px' },
              flexGrow: 1
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160, ...lightTextFieldStyle }}>
              <InputLabel id="status-filter-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" /> Status
              </InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  '& .MuiSelect-icon': { color: '#6b7280' }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#0f172a',
                      border: '1px solid rgba(0,0,0,0.06)',
                      '& .MuiMenuItem-root': { color: 'rgba(255,255,255,0.9)' },
                      '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                      '& .Mui-selected': { bgcolor: 'rgba(232, 184, 109, 0.2) !important', color: '#111827' }
                    }
                  }
                }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160, ...lightTextFieldStyle }}>
              <InputLabel id="sort-order-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SortIcon fontSize="small" /> Sort By
              </InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="Sort By"
                onChange={(e) => setSortOrder(e.target.value)}
                sx={{
                  '& .MuiSelect-icon': { color: '#6b7280' }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#0f172a',
                      border: '1px solid rgba(0,0,0,0.06)',
                      '& .MuiMenuItem-root': { color: 'rgba(255,255,255,0.9)' },
                      '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                      '& .Mui-selected': { bgcolor: 'rgba(232, 184, 109, 0.2) !important', color: '#111827' }
                    }
                  }
                }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="code_asc">Code (A-Z)</MenuItem>
                <MenuItem value="code_desc">Code (Z-A)</MenuItem>
                <MenuItem value="usage_desc">Most Used</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
              {selectedIds.length} item(s) selected:
            </Typography>
            <Button onClick={() => handleBulk(true)} disabled={bulkActivating} variant="outlined" size="small" sx={{ borderColor: 'rgba(52,211,153,0.3)', color: '#34d399', '&:hover': { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.08)' } }}>
              <CheckIcon fontSize="small" sx={{ mr: 0.5 }} /> Activate
            </Button>
            <Button onClick={() => handleBulk(false)} disabled={bulkActivating} variant="outlined" size="small" sx={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', '&:hover': { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' } }}>
              <CloseIcon fontSize="small" sx={{ mr: 0.5 }} /> Deactivate
            </Button>
          </Box>
        )}
      </Paper>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} sx={{ color: '#111827' }} /></Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableCell sx={{ width: 48, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Box onClick={handleToggleSelectAll} sx={{ cursor: 'pointer' }}>
                    <CheckBoxIcon sx={{ color: selectedIds.length > 0 && selectedIds.length === filtered.length ? '#e8b86d' : 'rgba(255,255,255,0.25)' }} />
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Max Usage</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Used</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Expires</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)', width: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 10, borderBottom: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CouponIcon sx={{ fontSize: 54, color: '#111827', opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600 }}>No coupons available</Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>Create your first coupon code to get started.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {coupons.length > 0 && filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 10, borderBottom: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <SearchIcon sx={{ fontSize: 54, color: '#111827', opacity: 0.5 }} />
                      <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600 }}>No matching coupons</Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>Try adjusting your search or filters.</Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => { setSearch(''); setStatusFilter('all'); setSortOrder('newest'); }}
                        sx={{ mt: 2, color: '#111827', borderColor: '#10b981', borderRadius: '8px' }}
                      >
                        Clear Filters
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {filtered.length > 0 && (
                filtered.map(coupon => (
                  <TableRow key={coupon._id} sx={{ '&:hover': { bgcolor: '#ffffff' } }}>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Box onClick={() => handleToggleSelect(coupon._id)} sx={{ cursor: 'pointer' }}>
                        <CheckBoxIcon sx={{ color: selectedIds.includes(coupon._id) ? '#34d399' : 'rgba(255,255,255,0.25)' }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Typography sx={{ fontWeight: 700, color: '#111827', fontFamily: 'monospace', fontSize: '0.9rem' }}>{coupon.code}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)', color: '#6b7280' }}>{coupon.description || '—'}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)', color: 'rgba(255,255,255,0.8)' }}>{coupon.maxUsage}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)', color: 'rgba(255,255,255,0.8)' }}>{coupon.usedCount}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)', color: '#6b7280' }}>{formatDate(coupon.expiresAt)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Chip
                        label={coupon.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{ bgcolor: coupon.isActive ? 'rgba(52,211,153,0.18)' : 'rgba(239,68,68,0.18)', color: coupon.isActive ? '#34d399' : '#ef4444', border: `1px solid ${coupon.isActive ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)'}`, fontWeight: 700, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>{formatDate(coupon.createdAt)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <IconButton onClick={() => handleEdit(coupon)} sx={{ color: '#6b7280' }}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(coupon._id)} sx={{ color: 'rgba(239,68,68,0.6)' }}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// Simple checkbox icon (avoids pulling in Checkbox which has heavy styles)
function CheckBoxIcon({ sx }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={sx}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}
