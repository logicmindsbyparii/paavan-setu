import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Tooltip, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress,
  InputAdornment, FormControl, Select, MenuItem
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { adminRequest, logApiFailure } from '../../lib/api';

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

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
      logApiFailure('load users', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isActive = user.isActive !== false;
      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'active' 
          ? isActive 
          : !isActive;
          
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, filterStatus]);

  const handleToggleStatus = async (id, currentStatus) => {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    try {
      await adminRequest(`/api/admin/users/${id}/toggle`, { method: 'PUT' });
    } catch (err) {
      fetchUsers();
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
      <CircularProgress size={32} sx={{ color: '#111827' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
            Users Management
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
            Manage registered accounts, user credentials, and active permissions
          </Typography>
        </Box>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        mb: 3,
        p: 2,
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <TextField
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ ...lightTextFieldStyle, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            )
          }}
          size="small"
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={lightSelectStyle}
            displayEmpty
            startAdornment={
              <InputAdornment position="start" sx={{ ml: 1, mr: -0.5 }}>
                <FilterIcon sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            }
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="active">Active Only</MenuItem>
            <MenuItem value="suspended">Suspended Only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'var(--color-paper)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
      }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Registered At</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Active Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, borderBottom: 0 }}>
                  <Typography sx={{ color: '#9ca3af', mb: 2, fontSize: '1.1rem' }}>
                    {users.length === 0 ? 'No registered users found.' : 'No users match your search criteria.'}
                  </Typography>
                  {users.length > 0 && (
                    <Button 
                      variant="outlined" 
                      onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                      sx={{ 
                        color: '#111827', 
                        borderColor: 'rgba(232, 184, 109, 0.5)',
                        '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.1)' },
                        borderRadius: '8px',
                        textTransform: 'none',
                        px: 3
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id} sx={{ '&:hover': { bgcolor: '#ffffff' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#111827' }}>{user.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#4b5563', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{user.email}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '0.88rem' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
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
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Tooltip title="Edit User">
                      <IconButton onClick={() => handleOpenEdit(user)} size="small" sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>
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
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: '#111827',
            border: '1px solid rgba(232, 184, 109, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>Edit User Account</DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#e5e7eb' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              label="Name" 
              value={formData.name} 
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
              fullWidth 
              sx={lightTextFieldStyle}
            />
            <TextField 
              label="Email" 
              value={formData.email} 
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} 
              fullWidth 
              sx={lightTextFieldStyle}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: '#e5e7eb' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#6b7280', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={saving || !formData.name || !formData.email}
            sx={{
              bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
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
