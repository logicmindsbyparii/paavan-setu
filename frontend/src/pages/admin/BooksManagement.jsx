import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Switch, Tooltip, Divider, Skeleton, CircularProgress
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
  '& .MuiSelect-icon': { color: '#e8b86d' },
};

const emptyBook = {
  title: '', subtitle: '', description: '', authorName: '', categoryName: '',
  price: '', salePrice: '', isbn: '', pages: '', audience: '', stock: '',
  tag: '', language: 'English', isFeatured: false, isPublished: true,
  coverImage: '', slug: '', accentBg: '', accentBorder: '', accentCol: ''
};

export default function BooksManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState(emptyBook);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchBooks = async () => {
    try {
      const data = await adminRequest('/api/books/admin/all');
      setBooks(Array.isArray(data) ? data : data?.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleOpen = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title || '',
        subtitle: book.subtitle || '',
        description: book.description || '',
        authorName: book.authorName || '',
        categoryName: book.categoryName || '',
        price: book.price || '',
        salePrice: book.salePrice || '',
        isbn: book.isbn || '',
        pages: book.pages || '',
        audience: book.audience || '',
        stock: book.stock || '',
        tag: book.tag || '',
        language: book.language || 'English',
        isFeatured: book.isFeatured || false,
        isPublished: book.isPublished ?? true,
        coverImage: book.coverImage || '',
        slug: book.slug || '',
        accentBg: book.accent?.bg || '',
        accentBorder: book.accent?.border || '',
        accentCol: book.accent?.col || '',
      });
    } else {
      setEditingBook(null);
      setFormData(emptyBook);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const price = Number(formData.price) || 0;
    const salePrice = formData.salePrice ? Number(formData.salePrice) : undefined;

    if (salePrice !== undefined && salePrice >= price) {
      setError('Sale price must be lower than the regular price.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await adminRequest(
        editingBook ? `/api/books/admin/${editingBook._id}` : '/api/books/admin',
        {
          method: editingBook ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            subtitle: formData.subtitle,
            description: formData.description,
            authorName: formData.authorName,
            categoryName: formData.categoryName,
            price,
            salePrice,
            isbn: formData.isbn,
            pages: formData.pages ? Number(formData.pages) : undefined,
            audience: formData.audience,
            stock: formData.stock ? Number(formData.stock) : 0,
            tag: formData.tag,
            language: formData.language,
            isFeatured: formData.isFeatured,
            isPublished: formData.isPublished,
            coverImage: formData.coverImage,
            slug: formData.slug,
            accent: {
              bg: formData.accentBg,
              border: formData.accentBorder,
              col: formData.accentCol
            }
          }),
        }
      );
      setSuccess(editingBook ? 'Book updated!' : 'Book created!');
      setDialogOpen(false);
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await adminRequest(`/api/books/admin/${book._id}`, { method: 'DELETE' });
      setSuccess('Book deleted');
      fetchBooks();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleToggle = async (id, field) => {
    setBooks((prev) => prev.map((b) => (b._id === id ? { ...b, [field]: !b[field] } : b)));
    try {
      await adminRequest(`/api/books/admin/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field }),
      });
    } catch (err) {
      setBooks((prev) => prev.map((b) => (b._id === id ? { ...b, [field]: !b[field] } : b)));
      setError(err.message || 'Could not update the book');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setUploadingImage(true);
    setError('');
    
    try {
      const res = await adminRequest('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      
      setFormData(prev => ({ ...prev, coverImage: res.url || res }));
      setSuccess('Image uploaded successfully');
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const SkeletonRow = () => (
    <TableRow>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" width={40} height={56} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Box><Skeleton width={120} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /><Skeleton width={60} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></Box>
        </Box>
      </TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><Skeleton width={100} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><Skeleton width={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><Skeleton variant="circular" width={32} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><Skeleton variant="circular" width={32} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}><Box sx={{ display: 'flex', gap: 1 }}><Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /><Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></Box></TableCell>
    </TableRow>
  );

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, mb: 0.5, color: '#ffffff' }}>
            Books Catalog
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
            Add, update, or remove books from your store's inventory.
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
            px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)'
          }}
        >
          Add Book
        </Button>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} mb={3} />

      {/* Cyber Glass Table */}
      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Author</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Featured</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Published</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', width: 100 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : books.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 3, bgcolor: 'rgba(232, 184, 109, 0.1)', borderRadius: '50%', color: '#e8b86d' }}>
                      <MenuBookIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      No books available
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 300, mb: 2 }}>
                      Your catalog is currently empty. Start by adding a new book to your store.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      onClick={() => handleOpen()}
                      sx={{ color: '#e8b86d', borderColor: 'rgba(232, 184, 109, 0.4)', '&:hover': { borderColor: '#e8b86d', bgcolor: 'rgba(232, 184, 109, 0.1)' } }}
                    >
                      Add your first book
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              books.map((book) => (
                <TableRow key={book._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {book.coverImage ? (
                        <Box
                          component="img"
                          src={mediaUrl(book.coverImage)}
                          alt={book.title}
                          sx={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <Box sx={{ width: 44, height: 60, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <ImageIcon fontSize="small" />
                        </Box>
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{book.title}</Typography>
                        {book.tag && (
                          <Chip label={book.tag} size="small" sx={{ mt: 0.5, fontSize: '0.7rem', height: 20, bgcolor: 'rgba(232, 184, 109, 0.15)', color: '#f5d9a0', borderColor: 'rgba(232, 184, 109, 0.3)' }} variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{book.authorName || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem', color: '#e8b86d' }}>
                      ₹{book.salePrice || book.price}
                      {book.salePrice ? (
                        <Typography component="span" sx={{ textDecoration: 'line-through', ml: 1, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                          ₹{book.price}
                        </Typography>
                      ) : null}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.95rem', color: book.stock === 0 ? '#f43f5e' : 'rgba(255,255,255,0.85)' }}>
                      {book.stock ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Switch
                      checked={book.isFeatured}
                      onChange={() => handleToggle(book._id, 'isFeatured')}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#e8b86d' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#e8b86d' },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Switch
                      checked={book.isPublished}
                      onChange={() => handleToggle(book._id, 'isPublished')}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpen(book)} size="small" sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(book)} size="small" sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
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

      {/* Cyber Dark Glass Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
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
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, fontSize: '1.75rem', color: '#f5d9a0', pb: 1 }}>
          {editingBook ? 'Edit Book' : 'Add New Book'}
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 1 }}>
            
            {/* Section 1: Basic Details */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#e8b86d' }}>Basic Details</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField label="Subtitle" value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField label="Author Name" value={formData.authorName} onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField label="Category" value={formData.categoryName} onChange={e => setFormData(p => ({ ...p, categoryName: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField
                  label="Description *"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  multiline
                  rows={4}
                  fullWidth
                  sx={{ gridColumn: '1 / -1', ...darkTextFieldStyle }}
                />
                <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {formData.coverImage ? (
                    <Box 
                      component="img" 
                      src={mediaUrl(formData.coverImage)} 
                      alt="Preview" 
                      sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)' }}  
                    />
                  ) : (
                    <Box sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      <ImageIcon />
                    </Box>
                  )}
                  <TextField 
                    label="Cover Image URL" 
                    value={formData.coverImage} 
                    onChange={e => setFormData(p => ({ ...p, coverImage: e.target.value }))} 
                    fullWidth 
                    sx={darkTextFieldStyle}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingImage ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    disabled={uploadingImage}
                    sx={{ height: 56, whiteSpace: 'nowrap', px: 3, borderColor: 'rgba(232, 184, 109, 0.4)', color: '#e8b86d', '&:hover': { borderColor: '#e8b86d', bgcolor: 'rgba(232, 184, 109, 0.1)' } }}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

            {/* Section 2: Pricing & Inventory */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#e8b86d' }}>Pricing & Inventory</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Price (₹) *" type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField label="Sale Price (₹)" type="number" value={formData.salePrice} onChange={e => setFormData(p => ({ ...p, salePrice: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField label="Stock" type="number" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

            {/* Section 3: Book Specifications */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#e8b86d' }}>Book Specifications</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="ISBN" value={formData.isbn} onChange={e => setFormData(p => ({ ...p, isbn: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField label="Pages" type="number" value={formData.pages} onChange={e => setFormData(p => ({ ...p, pages: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <TextField select label="Language" value={formData.language} onChange={e => setFormData(p => ({ ...p, language: e.target.value }))} fullWidth sx={darkTextFieldStyle}>
                  {['English', 'Hindi', 'Gujarati', 'Bilingual'].map(l => (
                    <MenuItem key={l} value={l} sx={{ bgcolor: '#061e12', color: '#ffffff', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.2)' } }}>{l}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Audience" value={formData.audience} onChange={e => setFormData(p => ({ ...p, audience: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

            {/* Section 4: Metadata & Appearance */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: '#e8b86d' }}>Metadata & Appearance</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Slug (optional)" value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} fullWidth helperText="Leave empty to auto-generate from title" sx={{ gridColumn: '1 / -1', ...darkTextFieldStyle }} />
                <TextField label="Tag (e.g. Bestseller)" value={formData.tag} onChange={e => setFormData(p => ({ ...p, tag: e.target.value }))} fullWidth sx={darkTextFieldStyle} />
                <Box></Box>
                <TextField label="Accent Background (Hex)" value={formData.accentBg} onChange={e => setFormData(p => ({ ...p, accentBg: e.target.value }))} fullWidth placeholder="#eef6f0" helperText="Used for Tag chip background" sx={darkTextFieldStyle} />
                <TextField label="Accent Border (Hex)" value={formData.accentBorder} onChange={e => setFormData(p => ({ ...p, accentBorder: e.target.value }))} fullWidth placeholder="#cfe3d6" sx={darkTextFieldStyle} />
                <TextField label="Accent Text (Hex)" value={formData.accentCol} onChange={e => setFormData(p => ({ ...p, accentCol: e.target.value }))} fullWidth placeholder="#0c3b2e" helperText="Used for Tag chip text color" sx={darkTextFieldStyle} />
              </Box>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.description || !formData.price}
            sx={{
              bgcolor: '#e8b86d',
              color: '#071d12',
              '&:hover': { bgcolor: '#f5d9a0' },
              px: 4, py: 1.2, borderRadius: 2, fontWeight: 700,
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
            }}
          >
            {saving ? 'Saving...' : editingBook ? 'Update Book' : 'Create Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
