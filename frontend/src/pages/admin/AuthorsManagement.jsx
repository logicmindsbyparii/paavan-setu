import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Tooltip, Switch, Avatar,
  InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon,
  Search as SearchIcon, FilterList as FilterListIcon, Sort as SortIcon
} from '@mui/icons-material';
import { adminRequest, mediaUrl } from '../../lib/api';

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

const emptyAuthor = {
  name: '',
  bio: '',
  image: '',
  credentials: '',
  order: 0,
};

export default function AuthorsManagement() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formData, setFormData] = useState(emptyAuthor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('order_asc');

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const fetchAuthors = useCallback(async () => {
    try {
      const data = await adminRequest('/api/authors/admin');
      if (Array.isArray(data)) setAuthors(data);
      else if (data?.data) setAuthors(data.data);
    } catch (err) {
      setError('Failed to load authors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuthors(); }, [fetchAuthors]);

  const handleOpen = (author = null) => {
    if (author) {
      setEditingAuthor(author);
      setFormData({
        name: author.name || '',
        bio: author.bio || '',
        image: author.image || '',
        credentials: Array.isArray(author.credentials) ? author.credentials.join(', ') : '',
        order: author.order ?? 0,
      });
    } else {
      setEditingAuthor(null);
      setFormData(emptyAuthor);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        image: formData.image.trim(),
        credentials: typeof formData.credentials === 'string'
          ? formData.credentials.split(',').map(s => s.trim()).filter(Boolean)
          : formData.credentials,
        order: Number(formData.order) || 0,
      };

      if (editingAuthor) {
        await adminRequest(`/api/authors/admin/${editingAuthor._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Author updated successfully');
      } else {
        await adminRequest('/api/authors/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Author created successfully');
      }
      setDialogOpen(false);
      fetchAuthors();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminRequest(`/api/authors/admin/${deleteConfirm._id}`, { method: 'DELETE' });
      setSuccess('Author deleted');
      setDeleteConfirm(null);
      fetchAuthors();
    } catch (err) {
      setError('Delete failed');
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (id) => {
    const author = authors.find(a => a._id === id);
    if (!author) return;
    const currentActive = author.isActive !== false;

    // Optimistic update
    setAuthors(prev => prev.map(a => a._id === id ? { ...a, isActive: !currentActive } : a));

    try {
      const payload = {
        name: author.name,
        bio: author.bio || '',
        image: author.image || '',
        credentials: author.credentials || [],
        order: author.order ?? 0,
        isActive: !currentActive,
      };

      await adminRequest(`/api/authors/admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchAuthors();
    } catch (err) {
      setAuthors(prev => prev.map(a => a._id === id ? { ...a, isActive: currentActive } : a));
      setError('Toggle failed');
    }
  };

  const filtered = useMemo(() => {
    let result = authors;

    if (search.trim()) {
      const lowerQuery = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(lowerQuery) ||
        (a.bio || '').toLowerCase().includes(lowerQuery) ||
        (a.slug || '').toLowerCase().includes(lowerQuery)
      );
    }

    if (statusFilter !== 'all') {
      const isActiveFilter = statusFilter === 'active';
      result = result.filter(a => (a.isActive !== false) === isActiveFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortOrder) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'order_asc':
        default:
          return (a.order ?? 0) - (b.order ?? 0);
      }
    });
  }, [authors, search, statusFilter, sortOrder]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 16, gap: 2 }}>
        <CircularProgress size={36} sx={{ color: '#111827' }} />
        <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading authors…</Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
            Authors
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
            Manage book authors, contributors, and credentials
          </Typography>
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
            borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, py: 1.2
          }}
        >
          Add Author
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
            placeholder="Search authors..."
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
                <MenuItem value="newest">Newest First</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Cyber Glass Table */}
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
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Bio</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)', width: 100 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ borderBottom: 'none' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827' }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '1.1rem' }}>
                      No authors yet
                    </Typography>
                    <Typography sx={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', maxWidth: 320 }}>
                      Add your first author to get started. Authors appear on book detail pages.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpen()}
                      sx={{ mt: 1, bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease', borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Add Author
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <SearchIcon sx={{ fontSize: 54, color: '#111827', opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600 }}>No matching authors</Typography>
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
              filtered.map((author) => (
                <TableRow
                  key={author._id}
                  sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: '#ffffff' } }}
                >
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {author.image ? (
                        <Avatar
                          src={mediaUrl(author.image)}
                          alt={author.name}
                          sx={{ width: 40, height: 40, border: '1px solid rgba(0,0,0,0.12)' }}
                        />
                      ) : (
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#111827', fontWeight: 700 }}>
                          {author.name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#111827' }}>{author.name}</Typography>
                        {author.credentials?.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {author.credentials.join(' · ')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", color: '#111827', fontSize: '0.8rem' }}>
                      {author.slug || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography variant="body2" sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' }}>
                      {author.bio || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography variant="body2" sx={{ color: '#4b5563' }}>
                      {author.order ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Switch
                      checked={author.isActive !== false}
                      onChange={() => handleToggleActive(author._id)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }} align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleOpen(author)}
                        size="small"
                        sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => setDeleteConfirm(author)}
                        size="small"
                        sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}
                      >
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth
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
          {editingAuthor ? 'Edit Author' : 'Add New Author'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#e5e7eb' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Name"
              required
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              fullWidth
              placeholder="e.g. Shweta Kothari"
              sx={lightTextFieldStyle}
            />

            <TextField
              label="Bio"
              value={formData.bio}
              onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Brief description of the author..."
              sx={lightTextFieldStyle}
            />

            <Box>
              <TextField
                label="Image URL"
                value={formData.image}
                onChange={e => setFormData(p => ({ ...p, image: e.target.value }))}
                fullWidth
                placeholder="https://example.com/photo.jpg"
                sx={lightTextFieldStyle}
              />
              {formData.image && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={mediaUrl(formData.image)}
                    alt="Preview"
                    sx={{ width: 48, height: 48, border: '2px solid rgba(232, 184, 109, 0.4)' }}
                  />
                  <Typography variant="caption" sx={{ color: '#6b7280' }}>Image preview</Typography>
                </Box>
              )}
            </Box>

            <TextField
              label="Credentials"
              value={formData.credentials}
              onChange={e => setFormData(p => ({ ...p, credentials: e.target.value }))}
              fullWidth
              placeholder="Author, Speaker, Educator"
              helperText="Comma-separated list of credentials"
              sx={lightTextFieldStyle}
            />

            <TextField
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={e => setFormData(p => ({ ...p, order: e.target.value }))}
              fullWidth
              helperText="Lower numbers appear first"
              sx={lightTextFieldStyle}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: '#e5e7eb' }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            sx={{ color: '#6b7280', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            sx={{
              bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              fontWeight: 700, borderRadius: '10px', px: 3,
              '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
            }}
          >
            {saving ? 'Saving…' : editingAuthor ? 'Update Author' : 'Create Author'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: '#111827',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#f43f5e' }}>
          Delete Author
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4b5563' }}>
            Are you sure you want to delete <strong className="text-gray-900">{deleteConfirm?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            sx={{ color: '#6b7280', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            sx={{
              bgcolor: '#f43f5e',
              '&:hover': { bgcolor: '#e11d48' },
              fontWeight: 700, borderRadius: '10px',
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
