import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, IconButton, Tooltip
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { adminRequest } from '../../lib/api';

const statusColors = {
  new: { bg: 'rgba(59, 130, 246, 0.2)', col: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)', label: 'New' },
  read: { bg: 'rgba(245, 158, 11, 0.2)', col: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)', label: 'Read' },
  replied: { bg: 'rgba(16, 185, 129, 0.2)', col: '#34d399', border: 'rgba(16, 185, 129, 0.4)', label: 'Replied' },
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

export default function ContactsManagement() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${encodeURIComponent(filter)}` : '';
      const data = await adminRequest(`/api/contact${query}`);
      setContacts(Array.isArray(data) ? data : data?.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleStatusChange = async (contactId, newStatus) => {
    try {
      await adminRequest(`/api/contact/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccess('Status updated');
      fetchContacts();
      setSelectedContact((prev) =>
        prev && prev._id === contactId ? { ...prev, status: newStatus } : prev
      );
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (contactId) => {
    try {
      await adminRequest(`/api/contact/${contactId}`, { method: 'DELETE' });
      setSuccess('Contact deleted');
      setDeleteDialog(null);
      setSelectedContact(null);
      fetchContacts();
    } catch (err) {
      setError(err.message || 'Failed to delete contact');
    }
  };

  const handleViewDetail = async (contact) => {
    setSelectedContact(contact);
    if (contact.status === 'new') {
      await handleStatusChange(contact._id, 'read');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <Typography
            variant="h4"
            sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#ffffff' }}
          >
            Contacts Inquiries
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Manage user inquiries and consultation requests ({contacts.length})
          </Typography>
        </Box>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 160, ...darkSelectStyle }}
        >
          <MenuItem value="" sx={{ bgcolor: '#061e12', color: '#fff' }}>All Contacts</MenuItem>
          <MenuItem value="new" sx={{ bgcolor: '#061e12', color: '#fff' }}>New</MenuItem>
          <MenuItem value="read" sx={{ bgcolor: '#061e12', color: '#fff' }}>Read</MenuItem>
          <MenuItem value="replied" sx={{ bgcolor: '#061e12', color: '#fff' }}>Replied</MenuItem>
        </Select>
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
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: 'rgba(255,255,255,0.6)', borderBottom: 0 }}>
                  No contact inquiries found.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact._id}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: contact.status === 'new' ? 'rgba(59, 130, 246, 0.08)' : 'inherit',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
                  }}
                >
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{contact.name}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>{contact.email}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{contact.phone || '—'}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {contact.service && (
                      <Chip
                        label={contact.service}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(232, 184, 109, 0.15)',
                          color: '#f5d9a0',
                          border: '1px solid rgba(232, 184, 109, 0.3)',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Select
                      value={contact.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(contact._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{ ...darkSelectStyle, minWidth: 120 }}
                    >
                      {Object.keys(statusColors).map((s) => (
                        <MenuItem key={s} value={s} sx={{ bgcolor: '#061e12', color: '#fff' }}>
                          <Chip
                            label={statusColors[s].label}
                            size="small"
                            sx={{
                              bgcolor: statusColors[s].bg,
                              color: statusColors[s].col,
                              border: `1px solid ${statusColors[s].border}`,
                              fontWeight: 700,
                              fontSize: '0.65rem'
                            }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      {formatDate(contact.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(contact);
                          }}
                          sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {contact.status === 'new' && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(contact._id, 'read');
                            }}
                            sx={{ color: '#fbbf24', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)' } }}
                          >
                            <MarkEmailReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog(contact);
                          }}
                          sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Contact Detail Dialog */}
      <Dialog
        open={!!selectedContact}
        onClose={() => setSelectedContact(null)}
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
        {selectedContact && (
          <>
            <DialogTitle
              sx={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                color: '#f5d9a0'
              }}
            >
              <span>Contact Inquiry Details</span>
              <Chip
                label={statusColors[selectedContact.status]?.label || selectedContact.status}
                sx={{
                  bgcolor: statusColors[selectedContact.status]?.bg,
                  color: statusColors[selectedContact.status]?.col,
                  border: `1px solid ${statusColors[selectedContact.status]?.border}`,
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
                size="small"
              />
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#e8b86d', mb: 0.5, fontWeight: 700 }}>Name</Typography>
                <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{selectedContact.name}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#e8b86d', mb: 0.5, fontWeight: 700 }}>Email</Typography>
                <Typography sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{selectedContact.email}</Typography>
              </Box>

              {selectedContact.phone && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#e8b86d', mb: 0.5, fontWeight: 700 }}>Phone</Typography>
                  <Typography sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>{selectedContact.phone}</Typography>
                </Box>
              )}

              {selectedContact.service && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#e8b86d', mb: 0.5, fontWeight: 700 }}>Service Requested</Typography>
                  <Chip
                    label={selectedContact.service}
                    sx={{ bgcolor: 'rgba(232, 184, 109, 0.15)', color: '#f5d9a0', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 600 }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#e8b86d', mb: 0.5, fontWeight: 700 }}>Message</Typography>
                <Paper
                  elevation={0}
                  sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
                    {selectedContact.message}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#e8b86d', mb: 0.5, fontWeight: 700 }}>Submitted On</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)' }}>
                  {new Date(selectedContact.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button
                onClick={() => setSelectedContact(null)}
                sx={{ color: '#e8b86d', fontWeight: 700 }}
              >
                Close Window
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
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
          Are you sure you want to delete the contact from{' '}
          <strong className="text-white">{deleteDialog?.name}</strong>? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Button onClick={() => setDeleteDialog(null)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog?._id)} sx={{ bgcolor: '#f43f5e', color: '#fff', '&:hover': { bgcolor: '#e11d48' }, borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
