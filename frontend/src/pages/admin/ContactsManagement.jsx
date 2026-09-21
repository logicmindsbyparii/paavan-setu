import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Select, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, IconButton, Tooltip, TextField, InputAdornment, FormControl, InputLabel
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { Search, Clear, Info } from '@mui/icons-material';
import { adminRequest } from '../../lib/api';

const statusColors = {
  new: { bg: 'rgba(59, 130, 246, 0.2)', col: '#1d4ed8', border: 'rgba(59, 130, 246, 0.4)', label: 'New' },
  read: { bg: 'rgba(245, 158, 11, 0.2)', col: '#b45309', border: 'rgba(245, 158, 11, 0.4)', label: 'Read' },
  replied: { bg: 'rgba(16, 185, 129, 0.2)', col: '#047857', border: 'rgba(16, 185, 129, 0.4)', label: 'Replied' },
};

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

export default function ContactsManagement() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('dateDesc');
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest(`/api/contact`);
      setContacts(Array.isArray(data) ? data : data?.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const processedContacts = useMemo(() => {
    let result = [...contacts];

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(query) ||
        (c.email || '').toLowerCase().includes(query)
      );
    }

    if (filter) {
      result = result.filter(c => c.status === filter);
    }

    result.sort((a, b) => {
      if (sortBy === 'dateDesc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'dateAsc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

    return result;
  }, [contacts, debouncedSearch, filter, sortBy]);

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
        <CircularProgress sx={{ color: '#111827' }} />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, color: '#111827' }}>
            Contacts Inquiries
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>
            Manage user inquiries and consultation requests ({contacts.length})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search name/email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200, ...lightTextFieldStyle }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9ca3af' }} /></InputAdornment>,
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ color: '#9ca3af' }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: '#6b7280' }}>Status</InputLabel>
            <Select
              value={filter}
              label="Status"
              onChange={(e) => setFilter(e.target.value)}
              sx={lightSelectStyle}
            >
              <MenuItem value="" sx={{ bgcolor: '#ffffff', color: '#111827' }}>All Contacts</MenuItem>
              <MenuItem value="new" sx={{ bgcolor: '#ffffff', color: '#111827' }}>New</MenuItem>
              <MenuItem value="read" sx={{ bgcolor: '#ffffff', color: '#111827' }}>Read</MenuItem>
              <MenuItem value="replied" sx={{ bgcolor: '#ffffff', color: '#111827' }}>Replied</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: '#6b7280' }}>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
              sx={lightSelectStyle}
            >
              <MenuItem value="dateDesc" sx={{ bgcolor: '#ffffff', color: '#111827' }}>Newest First</MenuItem>
              <MenuItem value="dateAsc" sx={{ bgcolor: '#ffffff', color: '#111827' }}>Oldest First</MenuItem>
              <MenuItem value="status" sx={{ bgcolor: '#ffffff', color: '#111827' }}>By Status</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

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
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Service</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ borderBottom: 0 }}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Info sx={{ color: '#d1d5db', fontSize: 48 }} />
                    <Typography sx={{ color: '#6b7280', mt: 2, fontSize: '1.1rem' }}>
                      No contacts found matching your filters.
                    </Typography>
                    {(searchQuery || filter !== '') && (
                      <Button
                        onClick={() => { setSearchQuery(''); setFilter(''); }}
                        sx={{ mt: 2, color: '#111827', textTransform: 'none' }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              processedContacts.map((contact) => (
                <TableRow
                  key={contact._id}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: contact.status === 'new' ? 'rgba(59, 130, 246, 0.08)' : 'inherit',
                    '&:hover': { bgcolor: '#ffffff' }
                  }}
                >
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#111827' }}>{contact.name}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontSize: '0.9rem', color: '#4b5563' }}>{contact.email}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontSize: '0.9rem', color: '#6b7280', fontFamily: 'monospace' }}>{contact.phone || '—'}</Typography>
                  </TableCell>
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    {contact.service && (
                      <Chip
                        label={contact.service}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(16, 185, 129, 0.15)',
                          color: '#111827',
                          border: '1px solid rgba(232, 184, 109, 0.3)',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Select
                      value={contact.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(contact._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{ ...lightSelectStyle, minWidth: 120 }}
                    >
                      {Object.keys(statusColors).map((s) => (
                        <MenuItem key={s} value={s} sx={{ bgcolor: '#ffffff', color: '#111827' }}>
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
                  <TableCell onClick={() => handleViewDetail(contact)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {formatDate(contact.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(contact);
                          }}
                          sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}
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
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: '#111827',
            border: '1px solid rgba(232, 184, 109, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            p: 1
          }
        }}
      >
        {selectedContact && (
          <>
            <DialogTitle
              sx={{
                fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                color: '#111827'
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
            <DialogContent dividers sx={{ borderColor: '#e5e7eb' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#111827', mb: 0.5, fontWeight: 700 }}>Name</Typography>
                <Typography sx={{ fontWeight: 600, color: '#111827' }}>{selectedContact.name}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#111827', mb: 0.5, fontWeight: 700 }}>Email</Typography>
                <Typography sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{selectedContact.email}</Typography>
              </Box>

              {selectedContact.phone && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#111827', mb: 0.5, fontWeight: 700 }}>Phone</Typography>
                  <Typography sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>{selectedContact.phone}</Typography>
                </Box>
              )}

              {selectedContact.service && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#111827', mb: 0.5, fontWeight: 700 }}>Service Requested</Typography>
                  <Chip
                    label={selectedContact.service}
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 600 }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#111827', mb: 0.5, fontWeight: 700 }}>Message</Typography>
                <Paper
                  elevation={0}
                  sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid #e5e7eb' }}
                >
                  <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'rgba(255,255,255,0.9)' }}>
                    {selectedContact.message}
                  </Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#111827', mb: 0.5, fontWeight: 700 }}>Submitted On</Typography>
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
                sx={{ color: '#111827', fontWeight: 700 }}
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
          Are you sure you want to delete the contact from{' '}
          <strong className="text-gray-900">{deleteDialog?.name}</strong>? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2, borderColor: 'rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setDeleteDialog(null)} sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' } }}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteDialog?._id)} sx={{ bgcolor: '#f43f5e', color: '#111827', '&:hover': { bgcolor: '#e11d48' }, borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
