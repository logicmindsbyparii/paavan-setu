import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Drawer,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip
} from '@mui/material';
import FormAlerts from '../../components/ui/FormAlerts';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  ListAlt as ListAltIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon
} from '@mui/icons-material';
import { adminGetTests, adminCreateTest, adminUpdateTest, adminDeleteTest } from '../../lib/api';

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

const QuestionEditor = memo(({
  q,
  qIndex,
  totalQuestions,
  categories,
  expanded,
  onChangeExpansion,
  onQuestionChange,
  onDeleteQuestion,
  onMoveQuestion,
  onAddOption,
  onOptionChange,
  onDeleteOption,
  onPointChange
}) => {
  return (
    <Accordion
      disableGutters
      expanded={expanded}
      onChange={(e, isExpanded) => onChangeExpansion(qIndex, isExpanded)}
      TransitionProps={{ unmountOnExit: true }}
      sx={{
        border: '1px solid rgba(255, 255, 255, 0.12)',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        boxShadow: 'none',
        borderRadius: '16px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: '#e8b86d' }} />}
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)', '&.Mui-expanded': { borderBottom: '1px solid rgba(255, 255, 255, 0.12)' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
          <Typography sx={{ fontWeight: 600, color: '#ffffff' }}>
            {qIndex + 1}. {q.question?.substring(0, 50) || 'New Question'}{q.question?.length > 50 ? '...' : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" disabled={qIndex === 0} onClick={() => onMoveQuestion(qIndex, -1)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <ArrowUpIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={qIndex === totalQuestions - 1} onClick={() => onMoveQuestion(qIndex, 1)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <ArrowDownIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, bgcolor: 'transparent' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Question Text"
            value={q.question}
            onChange={(e) => onQuestionChange(qIndex, 'question', e.target.value)}
            fullWidth
            size="small"
            sx={darkTextFieldStyle}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e8b86d', mb: 2 }}>Options & Scoring Matrix</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {q.options.map((opt, optIndex) => (
                <Box key={optIndex} sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 3, border: '1px dashed rgba(255,255,255,0.15)' }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      label={`Option ${optIndex + 1}`}
                      value={opt.text}
                      onChange={(e) => onOptionChange(qIndex, optIndex, 'text', e.target.value)}
                      fullWidth
                      size="small"
                      sx={darkTextFieldStyle}
                    />
                    <IconButton onClick={() => onDeleteOption(qIndex, optIndex)} size="small" sx={{ alignSelf: 'flex-start', mt: 0.5, color: '#f43f5e' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 1.5, fontWeight: 600 }}>
                    Points assigned per category for selecting this option:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {categories.map(cat => (
                      <TextField
                        key={cat}
                        label={cat}
                        type="number"
                        value={opt.points?.[cat] !== undefined ? opt.points[cat] : ''}
                        onChange={(e) => onPointChange(qIndex, optIndex, cat, e.target.value)}
                        size="small"
                        sx={{ width: 110, ...darkTextFieldStyle }}
                      />
                    ))}
                    {categories.length === 0 && (
                      <Typography variant="caption" sx={{ color: '#f43f5e' }}>Add categories first to assign points.</Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            <Button
              size="small"
              onClick={() => onAddOption(qIndex)}
              sx={{ mt: 2, color: '#e8b86d', fontWeight: 700 }}
            >
              + Add Option
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button
              size="small"
              onClick={() => onDeleteQuestion(qIndex)}
              startIcon={<DeleteIcon />}
              sx={{ color: '#f43f5e', fontWeight: 700 }}
            >
              Delete Question
            </Button>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
});

const emptyFormMeta = { name: '', slug: '', description: '', categories: [] };
const emptyQuestion = { question: '', options: [{ text: '', points: {} }, { text: '', points: {} }] };

const TestsManagement = () => {
  const [formMeta, setFormMeta] = useState(emptyFormMeta);
  const [questions, setQuestions] = useState([]);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [drawerReady, setDrawerReady] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await adminGetTests();
      setTests(Array.isArray(data) ? data : data?.data ?? []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (test = null) => {
    setDrawerReady(false);
    if (test) {
      setFormMeta({
        name: test.name || '',
        slug: test.slug || '',
        description: test.description || '',
        categories: test.categories || [],
      });
      setQuestions(test.questions || []);
      setEditingId(test._id);

      const initialExpanded = {};
      if (test.questions?.length > 0) initialExpanded[0] = true;
      setExpandedQuestions(initialExpanded);
    } else {
      setFormMeta(emptyFormMeta);
      setQuestions([]);
      setEditingId(null);
      setExpandedQuestions({});
    }
    setOpenDrawer(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDrawerReady(true);
      });
    });
  };

  const handleClose = () => {
    if (window.confirm("Any unsaved changes will be lost. Continue?")) {
      setOpenDrawer(false);
      setFormMeta(emptyFormMeta);
      setQuestions([]);
      setEditingId(null);
      setCategoryInput('');
      setDrawerReady(false);
    }
  };

  const handleAddCategory = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = categoryInput.trim();
      if (trimmed && !formMeta.categories.includes(trimmed)) {
        setFormMeta(prev => ({ ...prev, categories: [...prev.categories, trimmed] }));
      }
      setCategoryInput('');
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    setFormMeta(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== categoryToDelete)
    }));
  };

  const handleAddQuestion = useCallback(() => {
    setQuestions(prev => {
      const next = [...prev, { ...emptyQuestion }];
      setExpandedQuestions(prev => ({ ...prev, [next.length - 1]: true }));
      return next;
    });
  }, []);

  const handleQuestionChange = useCallback((qIndex, field, value) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], [field]: value };
      return next;
    });
  }, []);

  const handleDeleteQuestion = useCallback((qIndex) => {
    setQuestions(prev => prev.filter((_, i) => i !== qIndex));
    setExpandedQuestions(prev => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        const idx = Number(key);
        if (idx < qIndex) next[idx] = val;
        else if (idx > qIndex) next[idx - 1] = val;
      });
      return next;
    });
  }, []);

  const handleMoveQuestion = useCallback((qIndex, direction) => {
    const newIndex = qIndex + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;

    setQuestions(prev => {
      const next = [...prev];
      const temp = next[qIndex];
      next[qIndex] = next[newIndex];
      next[newIndex] = temp;
      return next;
    });

    setExpandedQuestions(prev => {
      const next = { ...prev };
      const wasExpanded = !!prev[qIndex];
      const wasTargetExpanded = !!prev[newIndex];
      next[qIndex] = wasTargetExpanded;
      next[newIndex] = wasExpanded;
      return next;
    });
  }, [questions.length]);

  const handleAddOption = useCallback((qIndex) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = {
        ...next[qIndex],
        options: [...next[qIndex].options, { text: '', points: {} }]
      };
      return next;
    });
  }, []);

  const handleOptionChange = useCallback((qIndex, optIndex, field, value) => {
    setQuestions(prev => {
      const next = [...prev];
      const options = [...next[qIndex].options];
      options[optIndex] = { ...options[optIndex], [field]: value };
      next[qIndex] = { ...next[qIndex], options };
      return next;
    });
  }, []);

  const handleDeleteOption = useCallback((qIndex, optIndex) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = {
        ...next[qIndex],
        options: next[qIndex].options.filter((_, i) => i !== optIndex)
      };
      return next;
    });
  }, []);

  const handlePointChange = useCallback((qIndex, optIndex, category, value) => {
    setQuestions(prev => {
      const next = [...prev];
      const options = [...next[qIndex].options];
      const newPoints = { ...(options[optIndex].points || {}) };

      if (value === '' || value === null) {
        delete newPoints[category];
      } else {
        newPoints[category] = Number(value);
      }

      options[optIndex] = { ...options[optIndex], points: newPoints };
      next[qIndex] = { ...next[qIndex], options };
      return next;
    });
  }, []);

  const handleToggleExpansion = useCallback((qIndex, isExpanded) => {
    setExpandedQuestions(prev => ({ ...prev, [qIndex]: isExpanded }));
  }, []);

  const toggleAllQuestions = (expand) => {
    const newState = {};
    if (expand) {
      questions.forEach((_, i) => { newState[i] = true; });
    }
    setExpandedQuestions(newState);
  };

  const handleSubmit = async () => {
    const isEditing = !!editingId;
    setSaving(true);
    try {
      const payload = { ...formMeta, questions };
      if (editingId) {
        await adminUpdateTest(editingId, payload);
      } else {
        await adminCreateTest(payload);
      }
      fetchTests();
      setOpenDrawer(false);
      setFormMeta(emptyFormMeta);
      setQuestions([]);
      setEditingId(null);
      setSuccess(isEditing ? 'Test updated!' : 'Test created!');
    } catch (err) {
      setError(err.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await adminDeleteTest(id);
      fetchTests();
      setSuccess('Test deleted');
    } catch (err) {
      setError(err.message || 'Failed to delete test');
    } finally {
      setDeletingId(null);
    }
  };

  const isValid = formMeta.name.trim() !== '' && formMeta.slug.trim() !== '' && questions.length > 0;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress size={32} sx={{ color: '#e8b86d' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#ffffff', fontWeight: 700 }}>
            Tests Management
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
            Manage psychometric assessment templates, scoring vectors, and questions
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
          Add New Test
        </Button>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.06)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Categories</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Questions</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#e8b86d', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.map((test) => (
              <TableRow key={test._id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}>
                <TableCell sx={{ fontWeight: 600, color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{test.name}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{test.description || '—'}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {test.categories?.map((cat, i) => (
                      <Chip key={i} label={cat} size="small" sx={{ bgcolor: 'rgba(232, 184, 109, 0.15)', color: '#f5d9a0', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 600 }} />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Chip label={test.questions?.length || 0} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 700 }} />
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <IconButton onClick={() => handleOpen(test)} size="small" sx={{ color: '#e8b86d', '&:hover': { bgcolor: 'rgba(232, 184, 109, 0.15)' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(test._id)} disabled={deletingId === test._id} size="small" sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
                    {deletingId === test._id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {tests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <ListAltIcon sx={{ fontSize: 54, color: '#e8b86d', opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>No tests available</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Create your first psychometric test to get started.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Cyber Dark Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 600, md: 720 },
            bgcolor: '#061e12',
            backgroundImage: 'linear-gradient(145deg, #051c11 0%, #082a3e 100%)',
            color: '#ffffff',
            borderLeft: '1px solid rgba(232, 184, 109, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ p: 3.5, bgcolor: 'rgba(5, 28, 17, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#f5d9a0', fontWeight: 700 }}>
            {editingId ? 'Edit Psychometric Test' : 'Create New Psychometric Test'}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Drawer Content */}
        <Box sx={{ p: 3.5, flexGrow: 1, overflowY: 'auto' }}>
          {!drawerReady ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress size={32} sx={{ color: '#e8b86d' }} />
            </Box>
          ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* General Info */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e8b86d', mb: 3 }}>General Test Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Test Name"
                  required
                  value={formMeta.name}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={darkTextFieldStyle}
                />
                <TextField
                  label="Slug (e.g. ideal-career-test)"
                  required
                  value={formMeta.slug}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, slug: e.target.value }))}
                  fullWidth
                  size="small"
                  helperText="Used in the URL. Must be unique and hyphen-separated."
                  sx={darkTextFieldStyle}
                />
                <TextField
                  label="Description"
                  value={formMeta.description}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                  sx={darkTextFieldStyle}
                />
              </Box>
            </Box>

            {/* Categories Section */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e8b86d', mb: 1 }}>Categories / Vectors</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                Define the personality types, traits, or career paths this test measures.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {formMeta.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onDelete={() => handleDeleteCategory(category)}
                    sx={{ bgcolor: 'rgba(232, 184, 109, 0.15)', color: '#f5d9a0', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 700, borderRadius: 2 }}
                  />
                ))}
              </Box>
              <TextField
                label="Add Category (Press Enter)"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleAddCategory}
                fullWidth
                size="small"
                sx={darkTextFieldStyle}
              />
            </Box>

            {/* Questions Section */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e8b86d', display: 'flex', alignItems: 'center' }}>
                  Questions
                  <Chip label={questions.length} size="small" sx={{ ml: 1, bgcolor: 'rgba(232, 184, 109, 0.2)', color: '#ffffff', fontWeight: 700 }} />
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Expand All">
                    <IconButton size="small" onClick={() => toggleAllQuestions(true)} sx={{ color: '#e8b86d' }}>
                      <UnfoldMoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Collapse All">
                    <IconButton size="small" onClick={() => toggleAllQuestions(false)} sx={{ color: '#e8b86d' }}>
                      <UnfoldLessIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddQuestion}
                    sx={{ borderRadius: '10px', borderColor: 'rgba(232, 184, 109, 0.4)', color: '#e8b86d', '&:hover': { borderColor: '#e8b86d', bgcolor: 'rgba(232, 184, 109, 0.1)' } }}
                  >
                    Add Question
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {questions.map((q, qIndex) => (
                  <QuestionEditor
                    key={`${q._id || qIndex}-${qIndex}`}
                    q={q}
                    qIndex={qIndex}
                    totalQuestions={questions.length}
                    categories={formMeta.categories}
                    expanded={!!expandedQuestions[qIndex]}
                    onChangeExpansion={handleToggleExpansion}
                    onQuestionChange={handleQuestionChange}
                    onDeleteQuestion={handleDeleteQuestion}
                    onMoveQuestion={handleMoveQuestion}
                    onAddOption={handleAddOption}
                    onOptionChange={handleOptionChange}
                    onDeleteOption={handleDeleteOption}
                    onPointChange={handlePointChange}
                  />
                ))}
              </Box>
            </Box>
          </Box>
          )}

        </Box>

        {/* Drawer Footer */}
        <Box sx={{ p: 3, bgcolor: 'rgba(5, 28, 17, 0.95)', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'flex-end', gap: 2, position: 'sticky', bottom: 0, zIndex: 10 }}>
          <Button onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isValid || saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
            sx={{
              bgcolor: '#e8b86d',
              color: '#071d12',
              borderRadius: '10px',
              px: 4,
              fontWeight: 700,
              '&:hover': { bgcolor: '#f5d9a0' },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }
            }}
          >
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Test'}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default TestsManagement;
