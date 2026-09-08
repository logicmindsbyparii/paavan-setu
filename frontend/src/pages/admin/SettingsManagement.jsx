import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Alert, CircularProgress,
  Tabs, Tab, Grid, Switch, Divider, Skeleton, useMediaQuery, useTheme
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import SaveIcon from '@mui/icons-material/Save';
import { adminRequest } from '../../lib/api';

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

const CATEGORIES = [
  {
    label: 'General',
    settings: [
      { key: 'general.tagline', type: 'text', category: 'general', label: 'Tagline', help: 'Shown under the logo and in the footer.' },
    ],
  },
  {
    label: 'Contact',
    settings: [
      { key: 'contact.phone', type: 'text', category: 'contact', label: 'Phone Number', help: 'Display format, e.g. +91 63511-13766.' },
      { key: 'contact.email', type: 'text', category: 'contact', label: 'Email Address' },
      { key: 'contact.address', type: 'textarea', category: 'contact', label: 'Address', help: 'One line per row — line breaks are preserved on the contact page.' },
      { key: 'contact.whatsapp', type: 'text', category: 'contact', label: 'WhatsApp Number', help: 'Digits only, including country code, e.g. 916351113766.' },
      { key: 'contact.workingHours', type: 'text', category: 'contact', label: 'Working Hours' },
    ],
  },
  {
    label: 'Social',
    settings: [
      { key: 'social.instagram', type: 'url', category: 'social', label: 'Instagram URL' },
      { key: 'social.facebook', type: 'url', category: 'social', label: 'Facebook URL' },
      { key: 'social.youtube', type: 'url', category: 'social', label: 'YouTube URL' },
    ],
  },
  {
    label: 'Hero',
    settings: [
      { key: 'hero.title.line1', type: 'text', category: 'hero', label: 'Headline — first line', help: 'Rendered in white, e.g. "Building Character Through".' },
      { key: 'hero.title.line2', type: 'text', category: 'hero', label: 'Headline — highlighted word', help: 'Rendered in the green-to-blue gradient.' },
      { key: 'hero.description', type: 'textarea', category: 'hero', label: 'Hero Description' },
      { key: 'hero.ctaPrimary', type: 'text', category: 'hero', label: 'Primary Button Text' },
      { key: 'hero.ctaPrimaryLink', type: 'text', category: 'hero', label: 'Primary Button Link', help: 'A site path such as /schools-workshops.' },
      { key: 'hero.ctaSecondary', type: 'text', category: 'hero', label: 'Secondary Button Text' },
    ],
  },
  {
    label: 'Homepage',
    settings: [
      { key: 'services.description', type: 'textarea', category: 'homepage', label: 'Services Intro' },
      { key: 'services.items', type: 'json', category: 'homepage', label: 'Service Cards', help: 'Array of { title, desc, link, colSpan, bg, tone }.' },
      { key: 'homepage.whyTitle', type: 'text', category: 'homepage', label: '"Why Us" Heading' },
      { key: 'homepage.whyDescription', type: 'textarea', category: 'homepage', label: '"Why Us" Description' },
      { key: 'homepage.achievements', type: 'json', category: 'homepage', label: 'Achievements', help: 'Array of strings, e.g. "2000+ Students Guided".' },
      { key: 'homepage.testimonials', type: 'json', category: 'homepage', label: 'Testimonials', help: 'Array of { name, role, text }.' },
      { key: 'cta.title', type: 'text', category: 'homepage', label: 'Closing CTA Heading' },
      { key: 'cta.description', type: 'textarea', category: 'homepage', label: 'Closing CTA Description' },
      { key: 'cta.button', type: 'text', category: 'homepage', label: 'Closing CTA Button Text' },
    ],
  },
  {
    label: 'Footer',
    settings: [
      { key: 'footer.about', type: 'textarea', category: 'footer', label: 'About Blurb' },
      { key: 'footer.copyright', type: 'text', category: 'footer', label: 'Copyright Text' },
    ],
  },
];

const SETTING_BY_KEY = Object.fromEntries(
  CATEGORIES.flatMap((cat) => cat.settings.map((s) => [s.key, s]))
);

function SettingField({ setting, value, onChange }) {
  if (setting.type === 'boolean') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Switch
          checked={value === 'true'}
          onChange={(e) => onChange(setting.key, e.target.checked ? 'true' : 'false')}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
          }}
        />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
          {value === 'true' ? 'Enabled' : 'Disabled'}
        </Typography>
      </Box>
    );
  }

  const isJson = setting.type === 'json';
  const multiline = isJson || setting.type === 'textarea';

  const jsonError = (() => {
    if (!isJson || !value?.trim()) return '';
    try { JSON.parse(value); return ''; } catch (e) { return `Invalid JSON: ${e.message}`; }
  })();

  return (
    <TextField
      fullWidth
      label={setting.label}
      value={value || ''}
      onChange={(e) => onChange(setting.key, e.target.value)}
      type={setting.type === 'image' || setting.type === 'url' ? 'url' : undefined}
      multiline={multiline}
      minRows={isJson ? 6 : multiline ? 4 : undefined}
      error={Boolean(jsonError)}
      helperText={jsonError || setting.help || ' '}
      placeholder={setting.type === 'image' ? 'https://example.com/image.png' : ''}
      InputProps={isJson ? { sx: { fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 } } : undefined}
      sx={darkTextFieldStyle}
    />
  );
}

export default function SettingsManagement() {
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const rows = await adminRequest('/api/settings/admin');
      const flat = {};
      (Array.isArray(rows) ? rows : rows?.data || []).forEach((row) => {
        flat[row.key] =
          typeof row.value === 'object' && row.value !== null
            ? JSON.stringify(row.value, null, 2)
            : String(row.value ?? '');
      });
      setSettings(flat);
      setOriginalSettings(flat);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    const changed = Object.entries(settings).filter(
      ([key, value]) => value !== (originalSettings[key] ?? '')
    );

    if (changed.length === 0) {
      setSuccess('No changes to save');
      return;
    }

    const badJson = changed
      .map(([key]) => key)
      .filter((key) => {
        const field = SETTING_BY_KEY[key];
        if (field?.type !== 'json' || !settings[key].trim()) return false;
        try { JSON.parse(settings[key]); return false; } catch { return true; }
      });

    if (badJson.length) {
      setError(`Invalid JSON in: ${badJson.join(', ')}. Fix the syntax and save again.`);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = changed.map(([key, value]) => {
        const field = SETTING_BY_KEY[key] || {};
        return {
          key,
          value: field.type === 'json' && value.trim() ? JSON.parse(value) : value,
          type: field.type === 'json' ? 'json' : 'text',
          category: field.category || 'general',
        };
      });

      await adminRequest('/api/settings/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });

      setSuccess(`Saved ${payload.length} setting${payload.length > 1 ? 's' : ''} successfully`);
      setOriginalSettings({ ...settings });
    } catch (err) {
      setError(err.message || 'Server error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
    setSuccess('');
    setError('');
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const activeCategory = CATEGORIES[activeTab];

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, mb: 1, color: '#ffffff' }}>
            Site Settings
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
            Manage site configurations, brand details, hero copy, and contact parameters.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isDirty && (
            <Button variant="outlined" onClick={handleReset} sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>
              Discard Changes
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !isDirty}
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
      {isDirty && (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          You have unsaved changes. Don't forget to save before navigating away.
        </Alert>
      )}

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
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
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
              {CATEGORIES.map((cat) => (
                <Tab key={cat.label} label={cat.label} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 1, p: { xs: 3, md: 5 } }}>
            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, mb: 1, color: '#f5d9a0' }}>
              {activeCategory.label} Configuration
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4, fontSize: '0.95rem' }}>
              Update parameters that control how the {activeCategory.label.toLowerCase()} section renders on the public site.
            </Typography>

            <Grid container spacing={4}>
              {activeCategory.settings.map((setting) => (
                <Grid item xs={12} sm={setting.type === 'textarea' || setting.type === 'json' ? 12 : 6} key={setting.key}>
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#e8b86d', fontWeight: 700, bgcolor: 'rgba(232, 184, 109, 0.15)', px: 1.5, py: 0.5, borderRadius: 1.5, fontFamily: 'monospace' }}>
                      {setting.key}
                    </Typography>
                  </Box>
                  <SettingField
                    setting={setting}
                    value={settings[setting.key] || ''}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
