import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, CircularProgress, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import FormAlerts from '../../components/ui/FormAlerts';
import { adminGetTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial } from '../../lib/api';

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

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
      console.error(err);
      setError(err.message || 'Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

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
      console.error(err);
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
        console.error(err);
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
      console.error(err);
      setError(err.message || 'Failed to update status');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress sx={{ color: '#e8b86d' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#ffffff' }}>
            Testimonials Hub
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
            Manage student, parent, and institutional testimonials
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenNew}
          sx={{
            bgcolor: '#e8b86d',
            color: '#071d12',
            '&:hover': { bgcolor: '#f5d9a0' },
            px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)'
          }}
        >
          Add Testimonial
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
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Author Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Role / Affiliation</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Testimonial Excerpt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }} align="center">Active Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testimonials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'rgba(255,255,255,0.6)', borderBottom: 0 }}>
                  No testimonials found. Click "Add Testimonial" to add your first endorsement.
                </TableCell>
              </TableRow>
            ) : (
              testimonials.map((t) => (
                <TableRow key={t._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{t.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Chip label={t.role} size="small" sx={{ bgcolor: 'rgba(232, 184, 109, 0.15)', color: '#f5d9a0', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 350, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    "{t.text}"
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <IconButton onClick={() => handleOpenEdit(t)} size="small" sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}>
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
          {editingId ? 'Edit Testimonial' : 'New Testimonial'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <TextField
              label="Author Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={darkTextFieldStyle}
            />
            <TextField
              label="Role (e.g. Parent, Principal, Alumnus)"
              required
              fullWidth
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              sx={darkTextFieldStyle}
            />
            <TextField
              label="Testimonial Text"
              required
              fullWidth
              multiline
              rows={4}
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              sx={darkTextFieldStyle}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Button onClick={handleClose} disabled={submitting} sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitting}
              sx={{
                bgcolor: '#e8b86d',
                color: '#071d12',
                '&:hover': { bgcolor: '#f5d9a0' },
                fontWeight: 700, borderRadius: '10px', px: 3,
                '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
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
            bgcolor: '#061e12',
            backgroundImage: 'linear-gradient(145deg, #051c11 0%, #082a3e 100%)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#f43f5e' }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Are you sure you want to delete this testimonial? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Cancel</Button>
          <Button onClick={handleDelete} sx={{ bgcolor: '#f43f5e', color: '#fff', '&:hover': { bgcolor: '#e11d48' }, borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
