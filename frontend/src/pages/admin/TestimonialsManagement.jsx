import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, CircularProgress, Chip, InputAdornment, FormControl, Select, MenuItem, Tooltip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import FormAlerts from '../../components/ui/FormAlerts';
import { adminGetTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial, logApiFailure } from '../../lib/api';

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

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', text: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const data = await adminGetTestimonials();
      const testims = Array.isArray(data) ? data : data?.data ?? [];
      setTestimonials(testims);
      setError('');
    } catch (err) {
      // logApiFailure already records this with its context; the bare
      // console.error that used to sit here printed the same failure twice.
      logApiFailure('load testimonials', err);
      setError(err.message || 'Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      const matchesSearch = 
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.text?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'active' 
          ? t.isActive 
          : !t.isActive;
          
      return matchesSearch && matchesStatus;
    });
  }, [testimonials, searchQuery, filterStatus]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', role: '', text: '', isActive: true });
    setOpenDialog(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t._id);
    setFormData({ name: t.name, role: t.role, text: t.text, isActive: t.isActive });
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await adminUpdateTestimonial(editingId, formData);
      } else {
        await adminCreateTestimonial(formData);
      }
      handleClose();
      fetchTestimonials();
      setSuccess(editingId ? 'Testimonial updated!' : 'Testimonial created!');
    } catch (err) {
      logApiFailure('save testimonial', err);
      setError(err.message || 'Failed to save testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const confirmDelete = (id) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await adminDeleteTestimonial(deletingId);
        fetchTestimonials();
        setSuccess('Testimonial deleted');
      } catch (err) {
        logApiFailure('delete testimonial', err);
        setError(err.message || 'Failed to delete testimonial');
      } finally {
        setDeleteDialogOpen(false);
        setDeletingId(null);
      }
    }
  };

  const toggleActive = async (t) => {
    try {
      await adminUpdateTestimonial(t._id, { isActive: !t.isActive });
      fetchTestimonials();
      setSuccess(`Testimonial ${t.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      logApiFailure('toggle testimonial', err);
      setError(err.message || 'Failed to update status');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress sx={{ color: '#111827' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
            Testimonials Hub
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
            Manage student, parent, and institutional testimonials
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenNew}
          sx={{
            bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
            px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)'
          }}
        >
          Add Testimonial
        </Button>
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
          placeholder="Search by name, role or text..."
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
            <MenuItem value="inactive">Inactive Only</MenuItem>
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
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Author Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Role / Affiliation</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Testimonial Excerpt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }} align="center">Active Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTestimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, borderBottom: 0 }}>
                  <Typography sx={{ color: '#9ca3af', mb: 2, fontSize: '1.1rem' }}>
                    {testimonials.length === 0 ? 'No testimonials found. Click "Add Testimonial" to add your first endorsement.' : 'No testimonials match your search criteria.'}
                  </Typography>
                  {testimonials.length > 0 && (
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
              filteredTestimonials.map((t) => (
                <TableRow key={t._id} sx={{ '&:hover': { bgcolor: '#ffffff' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#111827' }}>{t.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Chip label={t.role} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 350, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    "{t.text}"
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Switch 
                      checked={t.isActive} 
                      onChange={() => toggleActive(t)} 
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <IconButton onClick={() => handleOpenEdit(t)} size="small" sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => confirmDelete(t._id)} size="small" sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth
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
          {editingId ? 'Edit Testimonial' : 'New Testimonial'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, borderColor: '#e5e7eb' }}>
            <TextField
              label="Author Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={lightTextFieldStyle}
            />
            <TextField
              label="Role (e.g. Parent, Principal, Alumnus)"
              required
              fullWidth
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              sx={lightTextFieldStyle}
            />
            <TextField
              label="Testimonial Text"
              required
              fullWidth
              multiline
              rows={4}
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              sx={lightTextFieldStyle}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderColor: '#e5e7eb' }}>
            <Button onClick={handleClose} disabled={submitting} sx={{ color: '#6b7280', fontWeight: 600 }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitting}
              sx={{
                bgcolor: 'var(--color-ink)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', opacity: 0.9, transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
                fontWeight: 700, borderRadius: '10px', px: 3,
                '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
              }}
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: '#111827',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#f43f5e' }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ color: '#6b7280' }}>
          Are you sure you want to delete this testimonial? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2, borderColor: 'rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' } }}>Cancel</Button>
          <Button onClick={handleDelete} sx={{ bgcolor: '#f43f5e', color: '#111827', '&:hover': { bgcolor: '#e11d48' }, borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
