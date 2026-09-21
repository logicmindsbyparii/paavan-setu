import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  CircularProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button, Tooltip, TextField, InputAdornment, FormControl, InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Search, Clear, Info } from '@mui/icons-material';
import FormAlerts from '../../components/ui/FormAlerts';
import { adminRequest } from '../../lib/api';

const statusColors = {
  pending: { bg: 'rgba(245, 158, 11, 0.15)', col: '#b45309', border: 'transparent' },
  paid: { bg: 'rgba(16, 185, 129, 0.15)', col: '#047857', border: 'transparent' },
  completed: { bg: 'rgba(16, 185, 129, 0.15)', col: '#047857', border: 'transparent' },
  failed: { bg: 'rgba(244, 63, 94, 0.15)', col: '#e11d48', border: 'transparent' },
  cancelled: { bg: 'rgba(156, 163, 175, 0.15)', col: '#374151', border: 'transparent' },
  refunded: { bg: 'rgba(59, 130, 246, 0.15)', col: '#1d4ed8', border: 'transparent' },
};

const lightSelectStyle = {
  bgcolor: 'var(--color-snow)',
  color: 'var(--color-ink)',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.15)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-green)', borderWidth: '2px' },
  '& .MuiSelect-icon': { color: 'var(--color-ink)' },
  '&.Mui-focused': { bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(10, 79, 34, 0.05)' }
};

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

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest(`/api/orders/admin`);
      setOrders(Array.isArray(data) ? data : data?.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(o => 
        (o.orderNumber || '').toLowerCase().includes(query) ||
        (o.customer?.name || '').toLowerCase().includes(query) ||
        (o.customer?.email || '').toLowerCase().includes(query)
      );
    }

    if (filter) {
      result = result.filter(o => o.status === filter);
    }

    result.sort((a, b) => {
      if (sortBy === 'dateDesc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'dateAsc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      if (sortBy === 'totalDesc') return (b.total || 0) - (a.total || 0);
      if (sortBy === 'totalAsc') return (a.total || 0) - (b.total || 0);
      return 0;
    });

    return result;
  }, [orders, debouncedSearch, filter, sortBy]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminRequest(`/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await adminRequest(`/api/orders/admin/${orderToDelete}`, {
        method: 'DELETE',
      });
      fetchOrders();
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete order');
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress sx={{ color: 'var(--color-ink)' }} />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: 'var(--color-ink)' }}>
            Orders Hub
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>Manage customer orders, payment states, and fulfillment ({orders.length})</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search order #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200, ...lightTextFieldStyle }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9ca3af' }} /></InputAdornment>,
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ color: '#9ca3af' }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: '#6b7280' }}>Status</InputLabel>
            <Select
              value={filter}
              label="Status"
              onChange={(e) => setFilter(e.target.value)}
              sx={lightSelectStyle}
            >
              <MenuItem value="" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>All Orders</MenuItem>
              <MenuItem value="pending" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Pending</MenuItem>
              <MenuItem value="paid" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Paid</MenuItem>
              <MenuItem value="completed" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Completed</MenuItem>
              <MenuItem value="failed" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Failed</MenuItem>
              <MenuItem value="cancelled" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Cancelled</MenuItem>
              <MenuItem value="refunded" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Refunded</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: '#6b7280' }}>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              sx={lightSelectStyle}
            >
              <MenuItem value="dateDesc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Newest First</MenuItem>
              <MenuItem value="dateAsc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Oldest First</MenuItem>
              <MenuItem value="totalDesc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Total: High-Low</MenuItem>
              <MenuItem value="totalAsc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>Total: Low-High</MenuItem>
              <MenuItem value="status" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>By Status</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <FormAlerts error={error} onDismissError={() => setError('')} />

      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'var(--color-paper)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ borderBottom: 0 }}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Info sx={{ color: '#d1d5db', fontSize: 48 }} />
                    <Typography sx={{ color: '#6b7280', mt: 2, fontSize: '1.1rem' }}>
                      No orders found matching your filters.
                    </Typography>
                    {(searchQuery || filter !== '') && (
                      <Button
                        onClick={() => { setSearchQuery(''); setFilter(''); }}
                        sx={{ mt: 2, color: 'var(--color-ink)', textTransform: 'none' }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              processedOrders.map((order) => {
                const conf = statusColors[order.status] || statusColors.pending;
                return (
                  <TableRow
                    key={order._id}
                    sx={{ '&:hover': { bgcolor: '#ffffff' } }}
                  >
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-ink)' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Typography sx={{ fontWeight: 600, color: 'var(--color-ink)' }}>{order.customer?.name || 'Guest User'}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {order.customer?.phone || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#4b5563', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      {order.items?.length || 0} item(s)
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Typography sx={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>₹{order.total?.toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        size="small"
                        sx={{ ...lightSelectStyle, minWidth: 130 }}
                      >
                        {['pending', 'paid', 'completed', 'failed', 'cancelled', 'refunded'].map(s => (
                          <MenuItem key={s} value={s} sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)' }}>
                            <Chip
                              label={s.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: statusColors[s]?.bg,
                                color: statusColors[s]?.col,
                                border: `1px solid ${statusColors[s]?.border}`,
                                fontWeight: 700,
                                fontSize: '0.65rem'
                              }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <Tooltip title="Delete Order">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setOrderToDelete(order._id);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: 'var(--color-ink)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            boxShadow: '0 24px 48px -12px rgba(244, 63, 94, 0.15)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#f43f5e' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6b7280' }}>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#6b7280' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteOrder} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
