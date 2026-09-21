import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Tooltip, Switch,
  InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, FilterList as FilterListIcon, Sort as SortIcon
} from '@mui/icons-material';
import { adminRequest } from '../../lib/api';

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

  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('order_asc');

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
        slug: editingCategory?.slug || generateSlug(formData.name),
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
    const currentActive = category.isActive !== false;

    // Optimistic update
    setCategories(prev => prev.map(c => c._id === category._id ? { ...c, isActive: !currentActive } : c));

    try {
      const payload = {
        name: category.name,
        slug: category.slug || generateSlug(category.name),
        description: category.description || '',
        color: category.color || '',
        icon: category.icon || '',
        order: category.order ?? 0,
        isActive: !currentActive,
      };

      await adminRequest(`/api/categories/admin/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchCategories();
    } catch (err) {
      setCategories(prev => prev.map(c => c._id === category._id ? { ...c, isActive: currentActive } : c));
      setError(err.message || 'Could not update the category');
    }
  };

  const filtered = useMemo(() => {
    let result = categories;

    if (search.trim()) {
      const lowerQuery = search.toLowerCase();
      result = result.filter(c =>
        (c.name || '').toLowerCase().includes(lowerQuery) ||
        (c.description || '').toLowerCase().includes(lowerQuery) ||
        (c.slug || '').toLowerCase().includes(lowerQuery)
      );
    }

    if (statusFilter !== 'all') {
      const isActiveFilter = statusFilter === 'active';
      result = result.filter(c => (c.isActive !== false) === isActiveFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortOrder) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'order_asc':
        default:
          return (a.order ?? 0) - (b.order ?? 0);
      }
    });
  }, [categories, search, statusFilter, sortOrder]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress sx={{ color: '#111827' }} />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
            Categories
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>Manage book categories & stream taxonomies</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
            px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)'
          }}
        >
          Add Category
        </Button>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      {/* Filter and Sort Toolbar */}
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
            placeholder="Search categories..."
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
                <MenuItem value="order_asc">Display Order</MenuItem>
                <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                <MenuItem value="name_desc">Name (Z-A)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'var(--color-paper)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Color</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#6b7280', borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.1rem' }}>No categories yet</Typography>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>Click "Add Category" to create one.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <SearchIcon sx={{ fontSize: 54, color: '#111827', opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600 }}>No matching categories</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Try adjusting your search or filters.</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => { setSearch(''); setStatusFilter('all'); setSortOrder('order_asc'); }}
                      sx={{ mt: 2, color: '#111827', borderColor: '#10b981', borderRadius: '8px' }}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cat) => (
                <TableRow key={cat._id} sx={{ '&:hover': { bgcolor: '#ffffff' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat.icon && <Typography sx={{ fontSize: '1.2rem' }}>{cat.icon}</Typography>}
                      <Typography sx={{ fontWeight: 600, color: '#111827' }}>{cat.name}</Typography>
                    </Box>
                    {cat.description && (
                      <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5, maxWidth: 300 }}>
                        {cat.description.length > 60 ? cat.description.slice(0, 60) + '…' : cat.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Chip label={cat.slug} size="small" sx={{ fontSize: '0.75rem', bgcolor: '#f3f4f6', color: '#111827', border: '1px solid rgba(255,255,255,0.15)' }} />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    {cat.color ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: cat.color, border: '1px solid rgba(0,0,0,0.12)' }} />
                        <Typography variant="caption" sx={{ color: '#6b7280', fontFamily: 'monospace' }}>{cat.color}</Typography>
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell sx={{ color: '#4b5563', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{cat.order ?? 0}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
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
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpen(cat)} size="small" sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>
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
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: '#111827',
            border: '1px solid rgba(232, 184, 109, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#e5e7eb' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Name *"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              fullWidth
              sx={lightTextFieldStyle}
            />
            {formData.name && !editingCategory && (
              <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.5, px: 2, py: 1, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
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
              sx={lightTextFieldStyle}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Color"
                value={formData.color}
                onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                placeholder="#0a4f22"
                fullWidth
                sx={lightTextFieldStyle}
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
                sx={lightTextFieldStyle}
              />
            </Box>
            <TextField
              label="Order"
              type="number"
              value={formData.order}
              onChange={e => setFormData(p => ({ ...p, order: e.target.value }))}
              fullWidth
              helperText="Lower numbers appear first"
              sx={lightTextFieldStyle}
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
              <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>Active Category</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: '#e5e7eb' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#6b7280', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            sx={{
              bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              fontWeight: 700, px: 3, borderRadius: '10px',
              '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
            }}
          >
            {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
