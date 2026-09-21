import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Switch, Tooltip, Divider, Skeleton, CircularProgress,
  InputAdornment
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
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

  // Filters & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const uniqueCategories = useMemo(() => {
    const cats = books.map((b) => b.categoryName).filter(Boolean);
    return ['All', ...new Set(cats)];
  }, [books]);

  const processedBooks = useMemo(() => {
    let result = [...books];

    // Apply Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.authorName?.toLowerCase().includes(q) ||
          b.isbn?.toLowerCase().includes(q)
      );
    }

    // Apply Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter((b) => b.categoryName === categoryFilter);
    }

    // Apply Stock Filter
    if (stockFilter === 'In Stock') {
      result = result.filter((b) => b.stock > 0);
    } else if (stockFilter === 'Out of Stock') {
      result = result.filter((b) => b.stock === 0);
    }

    // Apply Sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'price-desc':
          return (b.salePrice || b.price) - (a.salePrice || a.price);
        case 'price-asc':
          return (a.salePrice || a.price) - (b.salePrice || b.price);
        case 'stock-low':
          return (a.stock || 0) - (b.stock || 0);
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'newest':
        default:
          return -1; // Keep default API order or newest first assuming reverse chron
      }
    });

    return result;
  }, [books, debouncedSearch, categoryFilter, stockFilter, sortOrder]);

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
        price: book.price ?? '',
        salePrice: book.salePrice ?? '',
        isbn: book.isbn || '',
        pages: book.pages ?? '',
        audience: book.audience || '',
        stock: book.stock ?? '',
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
    const price = formData.price !== '' ? Number(formData.price) : 0;
    const salePrice = formData.salePrice !== '' ? Number(formData.salePrice) : null;

    if (salePrice !== null && salePrice >= price) {
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
            pages: formData.pages !== '' ? Number(formData.pages) : undefined,
            audience: formData.audience,
            stock: formData.stock !== '' ? Number(formData.stock) : 0,
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
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" width={40} height={56} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} />
          <Box><Skeleton width={120} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /><Skeleton width={60} height={20} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></Box>
        </Box>
      </TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><Skeleton width={100} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><Skeleton width={60} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><Skeleton width={40} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><Skeleton variant="circular" width={32} height={20} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><Skeleton variant="circular" width={32} height={20} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></TableCell>
      <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}><Box sx={{ display: 'flex', gap: 1 }}><Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /><Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(0,0,0,0.06)' }} /></Box></TableCell>
    </TableRow>
  );

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' }, mb: 3, gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, mb: 0.5, color: 'var(--color-ink)' }}>
            Books Catalog
          </Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '0.95rem' }}>
            Add, update, or remove books from your store's inventory.
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
            px: 3, py: 1.2, borderRadius: '14px', textTransform: 'none', fontWeight: 600, fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(10, 79, 34, 0.15)',
            alignSelf: { xs: 'flex-start', md: 'auto' }
          }}
        >
          Add Book
        </Button>
      </Box>

      {/* Filters Toolbar */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' }, gap: 2, mb: 4, p: 2, bgcolor: 'var(--color-paper)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <TextField
          placeholder="Search by title, author, ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9ca3af' }} /></InputAdornment>,
          }}
          sx={{ ...lightTextFieldStyle, '& .MuiOutlinedInput-root': { ...lightTextFieldStyle['& .MuiOutlinedInput-root'], borderRadius: '10px' } }}
        />
        
        <TextField
          select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: '#9ca3af' }} /></InputAdornment>,
          }}
          sx={{ ...lightTextFieldStyle, '& .MuiOutlinedInput-root': { ...lightTextFieldStyle['& .MuiOutlinedInput-root'], borderRadius: '10px' } }}
        >
          {uniqueCategories.map((cat) => (
            <MenuItem key={cat} value={cat} sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>
              {cat === 'All' ? 'All Categories' : cat}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><FilterListIcon sx={{ color: '#9ca3af' }} /></InputAdornment>,
          }}
          sx={{ ...lightTextFieldStyle, '& .MuiOutlinedInput-root': { ...lightTextFieldStyle['& .MuiOutlinedInput-root'], borderRadius: '10px' } }}
        >
          <MenuItem value="All" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>All Stock Status</MenuItem>
          <MenuItem value="In Stock" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>In Stock</MenuItem>
          <MenuItem value="Out of Stock" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>Out of Stock</MenuItem>
        </TextField>

        <TextField
          select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><SortIcon sx={{ color: '#9ca3af' }} /></InputAdornment>,
          }}
          sx={{ ...lightTextFieldStyle, '& .MuiOutlinedInput-root': { ...lightTextFieldStyle['& .MuiOutlinedInput-root'], borderRadius: '10px' } }}
        >
          <MenuItem value="newest" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>Newest First</MenuItem>
          <MenuItem value="name-asc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>Name A-Z</MenuItem>
          <MenuItem value="price-desc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>Price: High to Low</MenuItem>
          <MenuItem value="price-asc" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>Price: Low to High</MenuItem>
          <MenuItem value="stock-low" sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>Stock: Low to High</MenuItem>
        </TextField>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} mb={3} />

      {/* Cyber Glass Table */}
      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'var(--color-paper)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Author</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Featured</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Published</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'var(--color-ink)', borderBottom: '1px solid rgba(0,0,0,0.05)', width: 100 }} align="right">Actions</TableCell>
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
                    <Box sx={{ p: 3, bgcolor: 'var(--color-paper-muted)', borderRadius: '50%', color: 'var(--color-ink)' }}>
                      <MenuBookIcon sx={{ fontSize: 48 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                      No books available
                    </Typography>
                    <Typography sx={{ color: '#6b7280', maxWidth: 300, mb: 2 }}>
                      Your catalog is currently empty. Start by adding a new book to your store.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<AddIcon />} 
                      onClick={() => handleOpen()}
                      sx={{ color: 'var(--color-ink)', borderColor: 'var(--color-green)', '&:hover': { borderColor: 'var(--color-green)', bgcolor: 'var(--color-paper-muted)' } }}
                    >
                      Add your first book
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : processedBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 10, borderBottom: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-ink)', mb: 1 }}>No books found</Typography>
                  <Typography sx={{ color: '#6b7280' }}>Adjust your search or filters to see results.</Typography>
                  <Button variant="outlined" onClick={() => { setSearchTerm(''); setCategoryFilter('All'); setStockFilter('All'); setSortOrder('newest'); }} sx={{ mt: 2, color: 'var(--color-ink)', borderColor: 'var(--color-green)' }}>Clear Filters</Button>
                </TableCell>
              </TableRow>
            ) : (
              processedBooks.map((book) => (
                <TableRow key={book._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#ffffff' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {book.coverImage ? (
                        <Box
                          component="img"
                          src={mediaUrl(book.coverImage)}
                          alt={book.title}
                          sx={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', border: '1px solid rgba(0,0,0,0.06)' }}
                        />
                      ) : (
                        <Box sx={{ width: 44, height: 60, bgcolor: '#f3f4f6', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <ImageIcon fontSize="small" />
                        </Box>
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: 'var(--color-ink)' }}>{book.title}</Typography>
                        {book.tag && (
                          <Chip label={book.tag} size="small" sx={{ mt: 0.5, fontSize: '0.7rem', height: 20, bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-ink)', borderColor: 'var(--color-green)' }} variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#6b7280', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{book.authorName || '—'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--color-ink)' }}>
                      ₹{book.salePrice || book.price}
                      {book.salePrice ? (
                        <Typography component="span" sx={{ textDecoration: 'line-through', ml: 1, color: '#9ca3af', fontSize: '0.85rem' }}>
                          ₹{book.price}
                        </Typography>
                      ) : null}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.95rem', color: book.stock === 0 ? '#f43f5e' : 'rgba(255,255,255,0.85)' }}>
                      {book.stock ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Switch
                      checked={book.isFeatured}
                      onChange={() => handleToggle(book._id, 'isFeatured')}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--color-ink)' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'var(--color-ink)' },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Switch
                      checked={book.isPublished}
                      onChange={() => handleToggle(book._id, 'isPublished')}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--color-green)' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'var(--color-green)' },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpen(book)} size="small" sx={{ color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>
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
            bgcolor: '#ffffff',
            bgcolor: '#ffffff',
            color: 'var(--color-ink)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.15)',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', fontWeight: 700, fontSize: '1.75rem', color: 'var(--color-ink)', pb: 1 }}>
          {editingBook ? 'Edit Book' : 'Add New Book'}
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 1 }}>
            
            {/* Section 1: Basic Details */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: 'var(--color-ink)' }}>Basic Details</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField label="Subtitle" value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField label="Author Name" value={formData.authorName} onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField label="Category" value={formData.categoryName} onChange={e => setFormData(p => ({ ...p, categoryName: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField
                  label="Description *"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  multiline
                  rows={4}
                  fullWidth
                  sx={{ gridColumn: '1 / -1', ...lightTextFieldStyle }}
                />
                <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {formData.coverImage ? (
                    <Box 
                      component="img" 
                      src={mediaUrl(formData.coverImage)} 
                      alt="Preview" 
                      sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2, border: '1px solid rgba(0,0,0,0.12)' }}  
                    />
                  ) : (
                    <Box sx={{ width: 56, height: 56, bgcolor: '#f3f4f6', borderRadius: 2, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                      <ImageIcon />
                    </Box>
                  )}
                  <TextField 
                    label="Cover Image URL" 
                    value={formData.coverImage} 
                    onChange={e => setFormData(p => ({ ...p, coverImage: e.target.value }))} 
                    fullWidth 
                    sx={lightTextFieldStyle}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={uploadingImage ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    disabled={uploadingImage}
                    sx={{ height: 56, whiteSpace: 'nowrap', px: 3, borderColor: 'var(--color-green)', color: 'var(--color-ink)', '&:hover': { borderColor: 'var(--color-green)', bgcolor: 'var(--color-paper-muted)' } }}
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#e5e7eb' }} />

            {/* Section 2: Pricing & Inventory */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: 'var(--color-ink)' }}>Pricing & Inventory</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Price (₹) *" type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField label="Sale Price (₹)" type="number" value={formData.salePrice} onChange={e => setFormData(p => ({ ...p, salePrice: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField label="Stock" type="number" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#e5e7eb' }} />

            {/* Section 3: Book Specifications */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: 'var(--color-ink)' }}>Book Specifications</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="ISBN" value={formData.isbn} onChange={e => setFormData(p => ({ ...p, isbn: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField label="Pages" type="number" value={formData.pages} onChange={e => setFormData(p => ({ ...p, pages: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <TextField select label="Language" value={formData.language} onChange={e => setFormData(p => ({ ...p, language: e.target.value }))} fullWidth sx={lightTextFieldStyle}>
                  {['English', 'Hindi', 'Gujarati', 'Bilingual'].map(l => (
                    <MenuItem key={l} value={l} sx={{ bgcolor: '#ffffff', color: 'var(--color-ink)', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' } }}>{l}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Audience" value={formData.audience} onChange={e => setFormData(p => ({ ...p, audience: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#e5e7eb' }} />

            {/* Section 4: Metadata & Appearance */}
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2, color: 'var(--color-ink)' }}>Metadata & Appearance</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Slug (optional)" value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} fullWidth helperText="Leave empty to auto-generate from title" sx={{ gridColumn: '1 / -1', ...lightTextFieldStyle }} />
                <TextField label="Tag (e.g. Bestseller)" value={formData.tag} onChange={e => setFormData(p => ({ ...p, tag: e.target.value }))} fullWidth sx={lightTextFieldStyle} />
                <Box></Box>
                <TextField label="Accent Background (Hex)" value={formData.accentBg} onChange={e => setFormData(p => ({ ...p, accentBg: e.target.value }))} fullWidth placeholder="#eef6f0" helperText="Used for Tag chip background" sx={lightTextFieldStyle} />
                <TextField label="Accent Border (Hex)" value={formData.accentBorder} onChange={e => setFormData(p => ({ ...p, accentBorder: e.target.value }))} fullWidth placeholder="#cfe3d6" sx={lightTextFieldStyle} />
                <TextField label="Accent Text (Hex)" value={formData.accentCol} onChange={e => setFormData(p => ({ ...p, accentCol: e.target.value }))} fullWidth placeholder="#0c3b2e" helperText="Used for Tag chip text color" sx={lightTextFieldStyle} />
              </Box>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderColor: '#e5e7eb' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#6b7280', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !formData.title || !formData.description || !formData.price}
            sx={{
              bgcolor: 'var(--color-green)',
              color: 'var(--color-snow)',
              '&:hover': { bgcolor: 'var(--color-ink)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              px: 4, py: 1.2, borderRadius: '12px', fontWeight: 600,
              boxShadow: '0 4px 12px rgba(10, 79, 34, 0.2)',
              '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af', boxShadow: 'none', transform: 'none' }
            }}
          >
            {saving ? 'Saving...' : editingBook ? 'Update Book' : 'Create Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
