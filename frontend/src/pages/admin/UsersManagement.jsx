import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Tooltip, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { adminRequest } from '../../lib/api';

const darkTextFieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#ffffff',
    bgcolor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.18)' },
    '&:hover fieldset': { borderColor: '#e8b86d' },
    '&.Mui-focused fieldset': { borderColor: '#e8b86d' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#e8b86d' },
  '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.55)' },
};

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminRequest('/api/admin/users');
      setUsers(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    try {
      await adminRequest(`/api/admin/users/${id}/toggle`, { method: 'PUT' });
    } catch (err) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: currentStatus } : u));
      setError(err.message || 'Could not update user status');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}"?`)) return;
    try {
      await adminRequest(`/api/admin/users/${user._id}`, { method: 'DELETE' });
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email });
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      await adminRequest(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSuccess('User updated successfully');
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress size={32} sx={{ color: '#e8b86d' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#ffffff' }}>
            Users Management
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
            Manage registered accounts, user credentials, and active permissions
          </Typography>
        </Box>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Registered At</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Active Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'rgba(255,255,255,0.6)', borderBottom: 0 }}>
                  No registered users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{user.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{user.email}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.88rem' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Tooltip title={user.isActive !== false ? "Suspend User" : "Activate User"}>
                      <Switch 
                        checked={user.isActive !== false} 
                        onChange={() => handleToggleStatus(user._id, user.isActive !== false)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                        }}
                      />
                    </Tooltip>
                    <Chip 
                      label={user.isActive !== false ? "Active" : "Suspended"} 
                      sx={{
                        ml: 1, fontSize: '0.7rem', fontWeight: 700,
                        bgcolor: user.isActive !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: user.isActive !== false ? '#34d399' : '#fb7185',
                        border: `1px solid ${user.isActive !== false ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Tooltip title="Edit User">
                      <IconButton onClick={() => handleOpenEdit(user)} size="small" sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton onClick={() => handleDelete(user)} size="small" sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit User Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
        disableEnforceFocus
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: '#061e12',
            backgroundImage: 'linear-gradient(145deg, #051c11 0%, #082a3e 100%)',
            color: '#ffffff',
            border: '1px solid rgba(232, 184, 109, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#f5d9a0' }}>Edit User Account</DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              label="Name" 
              value={formData.name} 
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
              fullWidth 
              sx={darkTextFieldStyle}
            />
            <TextField 
              label="Email" 
              value={formData.email} 
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} 
              fullWidth 
              sx={darkTextFieldStyle}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={saving || !formData.name || !formData.email}
            sx={{
              bgcolor: '#e8b86d',
              color: '#071d12',
              '&:hover': { bgcolor: '#f5d9a0' },
              fontWeight: 700, borderRadius: '10px', px: 3
            }}
          >
            {saving ? 'Saving...' : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
