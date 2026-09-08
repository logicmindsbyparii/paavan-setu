import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress
} from '@mui/material';
import { adminRequest } from '../../lib/api';

export default function TestAnalytics() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await adminRequest('/api/admin/test-results');
      setResults(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error('Failed to fetch test results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress size={32} sx={{ color: '#e8b86d' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, color: '#ffffff' }}>
          Psychometric Assessment Analytics
        </Typography>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
          Inspect user assessment completions, biometric DMIT scores, and recommended career vectors
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{
        bgcolor: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Test Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Top Recommendation</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Date Taken</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'rgba(255,255,255,0.6)', borderBottom: 0 }}>
                  No test results found yet.
                </TableCell>
              </TableRow>
            ) : (
              results.map((row) => (
                <TableRow key={row._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{row.user?.name || 'Anonymous User'}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{row.user?.email || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 500 }}>{row.testName}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {row.topRecommendation ? (
                      <Chip
                        label={row.topRecommendation}
                        size="small"
                        sx={{ bgcolor: 'rgba(232, 184, 109, 0.18)', color: '#f5d9a0', border: '1px solid rgba(232, 184, 109, 0.35)', fontWeight: 700 }}
                      />
                    ) : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.88rem' }}>
                    {new Date(row.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {Object.entries(row.resultData || {}).map(([key, val]) => `${key}: ${val}`).join('\n')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
