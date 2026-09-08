import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  CircularProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FormAlerts from '../../components/ui/FormAlerts';
import { adminRequest } from '../../lib/api';

const statusColors = {
  pending: { bg: 'rgba(245, 158, 11, 0.2)', col: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' },
  paid: { bg: 'rgba(16, 185, 129, 0.2)', col: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
  completed: { bg: 'rgba(16, 185, 129, 0.2)', col: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
  failed: { bg: 'rgba(244, 63, 94, 0.2)', col: '#fb7185', border: 'rgba(244, 63, 94, 0.4)' },
  cancelled: { bg: 'rgba(156, 163, 175, 0.2)', col: '#9ca3af', border: 'rgba(156, 163, 175, 0.4)' },
  refunded: { bg: 'rgba(59, 130, 246, 0.2)', col: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' },
};

const darkSelectStyle = {
  bgcolor: 'rgba(255, 255, 255, 0.06)',
  color: '#ffffff',
  borderRadius: '12px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#e8b86d' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e8b86d' },
  '& .MuiSelect-icon': { color: '#e8b86d' },
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${encodeURIComponent(filter)}` : '';
      const data = await adminRequest(`/api/orders/admin${query}`);
      setOrders(Array.isArray(data) ? data : data?.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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
        <CircularProgress sx={{ color: '#e8b86d' }} />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#ffffff' }}>
            Orders Hub
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Manage customer orders, payment states, and fulfillment</Typography>
        </Box>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 160, ...darkSelectStyle }}
        >
          <MenuItem value="" sx={{ bgcolor: '#061e12', color: '#fff' }}>All Orders</MenuItem>
          <MenuItem value="pending" sx={{ bgcolor: '#061e12', color: '#fff' }}>Pending</MenuItem>
          <MenuItem value="paid" sx={{ bgcolor: '#061e12', color: '#fff' }}>Paid</MenuItem>
          <MenuItem value="completed" sx={{ bgcolor: '#061e12', color: '#fff' }}>Completed</MenuItem>
          <MenuItem value="failed" sx={{ bgcolor: '#061e12', color: '#fff' }}>Failed</MenuItem>
          <MenuItem value="cancelled" sx={{ bgcolor: '#061e12', color: '#fff' }}>Cancelled</MenuItem>
          <MenuItem value="refunded" sx={{ bgcolor: '#061e12', color: '#fff' }}>Refunded</MenuItem>
        </Select>
      </Box>

      <FormAlerts error={error} onDismissError={() => setError('')} />

      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: 'rgba(255,255,255,0.6)', borderBottom: 0 }}>
                  No orders found for the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const conf = statusColors[order.status] || statusColors.pending;
                return (
                  <TableRow
                    key={order._id}
                    sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                  >
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#e8b86d' }}>
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{order.customer?.name || 'Guest User'}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        {order.customer?.phone || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {order.items?.length || 0} item(s)
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography sx={{ fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>₹{order.total?.toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        size="small"
                        sx={{ ...darkSelectStyle, minWidth: 130 }}
                      >
                        {['pending', 'paid', 'completed', 'failed', 'cancelled', 'refunded'].map(s => (
                          <MenuItem key={s} value={s} sx={{ bgcolor: '#061e12', color: '#fff' }}>
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
                    <TableCell sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
            bgcolor: '#061e12',
            backgroundImage: 'linear-gradient(145deg, #051c11 0%, #082a3e 100%)',
            color: '#ffffff',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#f43f5e' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
