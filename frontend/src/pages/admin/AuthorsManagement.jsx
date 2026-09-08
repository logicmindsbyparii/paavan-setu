import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Tooltip, Switch, Avatar
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import { adminRequest, mediaUrl } from '../../lib/api';

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
    try {
      await adminRequest(`/api/authors/admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !authors.find(a => a._id === id)?.isActive }),
      });
      fetchAuthors();
    } catch (err) {
      setError('Toggle failed');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 16, gap: 2 }}>
        <CircularProgress size={36} sx={{ color: '#e8b86d' }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Loading authors…</Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#ffffff' }}>
            Authors
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
            Manage book authors, contributors, and credentials
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{
            bgcolor: '#e8b86d',
            color: '#071d12',
            '&:hover': { bgcolor: '#f5d9a0' },
            borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, py: 1.2
          }}
        >
          Add Author
        </Button>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      {/* Cyber Glass Table */}
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
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Bio</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', width: 100 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {authors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ borderBottom: 'none' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(232, 184, 109, 0.15)', color: '#e8b86d' }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, color: '#ffffff', fontSize: '1.1rem' }}>
                      No authors yet
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textAlign: 'center', maxWidth: 320 }}>
                      Add your first author to get started. Authors appear on book detail pages.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpen()}
                      sx={{ mt: 1, bgcolor: '#e8b86d', color: '#071d12', '&:hover': { bgcolor: '#f5d9a0' }, borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Add Author
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              authors.map((author) => (
                <TableRow
                  key={author._id}
                  sx={{ '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {author.image ? (
                        <Avatar
                          src={mediaUrl(author.image)}
                          alt={author.name}
                          sx={{ width: 40, height: 40, border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                      ) : (
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(232, 184, 109, 0.2)', color: '#f5d9a0', fontWeight: 700 }}>
                          {author.name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{author.name}</Typography>
                        {author.credentials?.length > 0 && (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {author.credentials.join(' · ')}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", color: '#e8b86d', fontSize: '0.8rem' }}>
                      {author.slug || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="body2" sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.75)' }}>
                      {author.bio || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      {author.order ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => handleOpen(author)}
                        size="small"
                        sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}
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
          {editingAuthor ? 'Edit Author' : 'Add New Author'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Name"
              required
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              fullWidth
              placeholder="e.g. Shweta Kothari"
              sx={darkTextFieldStyle}
            />

            <TextField
              label="Bio"
              value={formData.bio}
              onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Brief description of the author..."
              sx={darkTextFieldStyle}
            />

            <Box>
              <TextField
                label="Image URL"
                value={formData.image}
                onChange={e => setFormData(p => ({ ...p, image: e.target.value }))}
                fullWidth
                placeholder="https://example.com/photo.jpg"
                sx={darkTextFieldStyle}
              />
              {formData.image && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={mediaUrl(formData.image)}
                    alt="Preview"
                    sx={{ width: 48, height: 48, border: '2px solid rgba(232, 184, 109, 0.4)' }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Image preview</Typography>
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
              sx={darkTextFieldStyle}
            />

            <TextField
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={e => setFormData(p => ({ ...p, order: e.target.value }))}
              fullWidth
              helperText="Lower numbers appear first"
              sx={darkTextFieldStyle}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            sx={{
              bgcolor: '#e8b86d',
              color: '#071d12',
              '&:hover': { bgcolor: '#f5d9a0' },
              fontWeight: 700, borderRadius: '10px', px: 3,
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
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
            bgcolor: '#061e12',
            backgroundImage: 'linear-gradient(145deg, #051c11 0%, #082a3e 100%)',
            color: '#ffffff',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#f43f5e' }}>
          Delete Author
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>
            Are you sure you want to delete <strong className="text-white">{deleteConfirm?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}
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
