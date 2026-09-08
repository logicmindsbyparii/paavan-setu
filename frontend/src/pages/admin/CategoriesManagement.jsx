import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Tooltip, Switch
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import AddIcon from '@mui/icons-material/Add';
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

const emptyCategory = {
  name: '',
  description: '',
  color: '',
  icon: '',
  order: '',
  isActive: true,
};

export default function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(emptyCategory);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      const data = await adminRequest('/api/categories/admin');
      setCategories(Array.isArray(data) ? data : data?.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name) =>
    name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleOpen = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '',
        icon: category.icon || '',
        order: category.order ?? '',
        isActive: category.isActive ?? true,
      });
    } else {
      setEditingCategory(null);
      setFormData(emptyCategory);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        order: formData.order !== '' ? Number(formData.order) : 0,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await adminRequest(`/api/categories/admin/${editingCategory._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Category updated!');
      } else {
        await adminRequest('/api/categories/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Category created!');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminRequest(`/api/categories/admin/${id}`, { method: 'DELETE' });
      setSuccess('Category deleted!');
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await adminRequest(`/api/categories/admin/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Could not update the category');
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
            Categories
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Manage book categories & stream taxonomies</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            bgcolor: '#e8b86d',
            color: '#071d12',
            '&:hover': { bgcolor: '#f5d9a0' },
            px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)'
          }}
        >
          Add Category
        </Button>
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
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Color</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'rgba(255,255,255,0.6)', borderBottom: 0 }}>
                  No categories found. Click "Add Category" to create one.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat.icon && <Typography sx={{ fontSize: '1.2rem' }}>{cat.icon}</Typography>}
                      <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{cat.name}</Typography>
                    </Box>
                    {cat.description && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.5, maxWidth: 300 }}>
                        {cat.description.length > 60 ? cat.description.slice(0, 60) + '…' : cat.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Chip label={cat.slug} size="small" sx={{ fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.08)', color: '#f5d9a0', border: '1px solid rgba(255,255,255,0.15)' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {cat.color ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: cat.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{cat.color}</Typography>
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{cat.order ?? 0}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Switch
                      checked={cat.isActive}
                      onChange={() => handleToggleActive(cat)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpen(cat)} size="small" sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(cat._id)} size="small" sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
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
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#f5d9a0' }}>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Name *"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              fullWidth
              sx={darkTextFieldStyle}
            />
            {formData.name && !editingCategory && (
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1.5, px: 2, py: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Generated Slug: <strong className="text-[#e8b86d] font-mono">{generateSlug(formData.name)}</strong>
                </Typography>
              </Box>
            )}
            <TextField
              label="Description"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              sx={darkTextFieldStyle}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Color"
                value={formData.color}
                onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                placeholder="#0a4f22"
                fullWidth
                sx={darkTextFieldStyle}
                InputProps={{
                  startAdornment: formData.color ? (
                    <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: formData.color, border: '1px solid rgba(255,255,255,0.3)', mr: 1, flexShrink: 0 }} />
                  ) : null,
                }}
              />
              <TextField
                label="Icon"
                value={formData.icon}
                onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                placeholder="e.g. 📚"
                fullWidth
                sx={darkTextFieldStyle}
              />
            </Box>
            <TextField
              label="Order"
              type="number"
              value={formData.order}
              onChange={e => setFormData(p => ({ ...p, order: e.target.value }))}
              fullWidth
              helperText="Lower numbers appear first"
              sx={darkTextFieldStyle}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={formData.isActive}
                onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                }}
              />
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>Active Category</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            sx={{
              bgcolor: '#e8b86d',
              color: '#071d12',
              '&:hover': { bgcolor: '#f5d9a0' },
              fontWeight: 700, px: 3, borderRadius: '10px',
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
            }}
          >
            {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
