import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Alert, CircularProgress,
  Tabs, Tab, Grid, Skeleton, useMediaQuery, useTheme, Select, MenuItem,
  FormControl, InputLabel
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import SaveIcon from '@mui/icons-material/Save';
import { adminRequest, getSeoSettings, adminUpdateSeoSetting } from '../../lib/api';

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
  '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
};

const DEFAULT_PATHS = [
  '/',
  '/career-counselling',
  '/books',
  '/schools-workshops',
  '/about',
  '/contact',
  '/test',
  '/login',
  '/register',
  '/privacy',
  '/terms',
];

export default function SeoManagement() {
  const [seoSettings, setSeoSettings] = useState([]);
  const [activePath, setActivePath] = useState(DEFAULT_PATHS[0]);
  const [customPath, setCustomPath] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchSettings = useCallback(async () => {
    try {
      const res = await getSeoSettings();
      setSeoSettings(res || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Update form data when path changes or seoSettings change
  useEffect(() => {
    const path = customPath || activePath;
    const existing = seoSettings.find(s => s.path === path);
    if (existing) {
      setFormData({
        title: existing.title || '',
        description: existing.description || '',
        keywords: existing.keywords || '',
        ogTitle: existing.ogTitle || '',
        ogDescription: existing.ogDescription || '',
        ogImage: existing.ogImage || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      });
    }
  }, [activePath, customPath, seoSettings]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const path = customPath || activePath;
    if (!path || !formData.title) {
      setError('Path and Title are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        path,
        ...formData
      };

      await adminUpdateSeoSetting(payload);
      setSuccess(`SEO settings for ${path} saved successfully`);
      fetchSettings(); // Refresh list to update any UI states if necessary
    } catch (err) {
      setError(err.message || 'Server error while saving SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const allPaths = Array.from(new Set([...DEFAULT_PATHS, ...seoSettings.map(s => s.path)])).sort();

  const SettingsSkeleton = () => (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
      <Box sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0 }}>
        {[...Array(6)].map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)' }} />)}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton width="40%" height={40} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton width="30%" height={20} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />
              <Skeleton variant="rounded" height={56} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, mb: 1, color: '#ffffff' }}>
            SEO Settings
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
            Manage page titles, descriptions, and meta tags for any route.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: '#e8b86d',
              color: '#071d12',
              '&:hover': { bgcolor: '#f5d9a0' },
              px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)',
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} mb={4} />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <Paper elevation={0} sx={{
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}>
          <Box sx={{
            width: { xs: '100%', md: 240 },
            flexShrink: 0,
            borderRight: { md: '1px solid rgba(255, 255, 255, 0.12)' },
            borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.12)', md: 'none' },
            bgcolor: 'rgba(255, 255, 255, 0.02)'
          }}>
            <Tabs
              orientation={isMobile ? 'horizontal' : 'vertical'}
              value={customPath ? false : activePath}
              onChange={(_, v) => {
                if (v !== false) {
                  setActivePath(v);
                  setCustomPath('');
                }
              }}
              variant="scrollable"
              sx={{
                '& .MuiTab-root': { 
                  alignItems: { xs: 'center', md: 'flex-start' }, 
                  textAlign: { xs: 'center', md: 'left' }, 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  py: { xs: 2, md: 2.5 }, 
                  px: 3,
                  color: 'rgba(255, 255, 255, 0.65)',
                  borderBottom: { md: '1px solid rgba(255, 255, 255, 0.05)' }
                },
                '& .Mui-selected': { color: '#ffffff !important', bgcolor: 'rgba(232, 184, 109, 0.15)', fontWeight: 700 },
                '& .MuiTabs-indicator': { 
                  left: isMobile ? undefined : 0, 
                  right: isMobile ? undefined : 'auto', 
                  width: isMobile ? undefined : 4,
                  bgcolor: '#e8b86d', 
                  borderRadius: isMobile ? '4px 4px 0 0' : '0 4px 4px 0' 
                },
              }}
            >
              {allPaths.map((path) => (
                <Tab key={path} label={path === '/' ? 'Home (/)' : path} value={path} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 } }}>
            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, mb: 1, color: '#f5d9a0' }}>
              Meta Configuration
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4, fontSize: '0.95rem' }}>
              Define exactly what appears in search engine results and social media shares for this route.
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Path"
                  value={customPath || activePath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="e.g. /my-custom-route"
                  helperText="Select from the left menu or type a custom path here."
                  sx={darkTextFieldStyle}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Page Title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Value-Education Books | Paavan SETU"
                  sx={darkTextFieldStyle}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meta Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  minRows={3}
                  sx={darkTextFieldStyle}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Keywords (comma separated)"
                  value={formData.keywords}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="e.g. education, career counselling, value books"
                  sx={darkTextFieldStyle}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Open Graph Title (og:title)"
                  value={formData.ogTitle}
                  onChange={(e) => handleChange('ogTitle', e.target.value)}
                  sx={darkTextFieldStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Open Graph Description (og:description)"
                  value={formData.ogDescription}
                  onChange={(e) => handleChange('ogDescription', e.target.value)}
                  sx={darkTextFieldStyle}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Open Graph Image URL (og:image)"
                  value={formData.ogImage}
                  onChange={(e) => handleChange('ogImage', e.target.value)}
                  placeholder="https://paavansetu.com/image.jpg"
                  sx={darkTextFieldStyle}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
