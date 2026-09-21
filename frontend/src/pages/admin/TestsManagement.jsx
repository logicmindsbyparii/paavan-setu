import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
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
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Pagination
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
  UnfoldLess as UnfoldLessIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ContentCopy as ContentCopyIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { adminGetTests, adminCreateTest, adminUpdateTest, adminDeleteTest, resolveTestImage } from '../../lib/api';

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

const DIFFICULTY_STYLE = {
  beginner: { bg: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' },
  intermediate: { bg: 'rgba(232,184,109,0.15)', color: '#111827', border: '1px solid rgba(232,184,109,0.35)' },
  advanced: { bg: 'rgba(244,63,94,0.15)', color: '#f87171', border: '1px solid rgba(244,63,94,0.3)' },
};

const QuestionEditor = memo(({
  q,
  qIndex,
  totalQuestions,
  categories,
  expanded,
  scoringMode,
  onChangeExpansion,
  onQuestionChange,
  onDuplicateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
  onAddOption,
  onOptionChange,
  onDeleteOption,
  onPointChange,
  onSetCorrectOption
}) => {
  const isScored = scoringMode === 'scored';
  const diffStyle = DIFFICULTY_STYLE[q.difficulty || 'intermediate'] || DIFFICULTY_STYLE.intermediate;
  return (
    <Accordion
      disableGutters
      expanded={expanded}
      onChange={(e, isExpanded) => onChangeExpansion(qIndex, isExpanded)}
      TransitionProps={{ unmountOnExit: true }}
      sx={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        bgcolor: 'rgba(0, 0, 0, 0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderRadius: '16px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: '#111827' }} />}
        sx={{ bgcolor: 'rgba(0,0,0,0.02)', '&.Mui-expanded': { borderBottom: '1px solid rgba(0,0,0,0.05)' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {qIndex + 1}. {q.question?.substring(0, 50) || 'New Question'}{q.question?.length > 50 ? '...' : ''}
            </Typography>
            <Chip
              label={q.difficulty || 'intermediate'}
              size="small"
              sx={{ ...diffStyle, fontWeight: 700, fontSize: '0.65rem', textTransform: 'capitalize', height: 20, flexShrink: 0 }}
            />
            {isScored && q.correctOptionIndex == null && (
              <Tooltip title="This question has no correct answer — a scored test needs a key for every item.">
                <WarningIcon sx={{ fontSize: 16, color: '#f87171', flexShrink: 0 }} />
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" onClick={() => onDuplicateQuestion(qIndex)} sx={{ color: '#6b7280' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={qIndex === 0} onClick={() => onMoveQuestion(qIndex, -1)} sx={{ color: '#6b7280' }}>
              <ArrowUpIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={qIndex === totalQuestions - 1} onClick={() => onMoveQuestion(qIndex, 1)} sx={{ color: '#6b7280' }}>
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
            sx={lightTextFieldStyle}
          />
          <Box>
            <TextField
              label="Question image URL (diagram / table shown above options)"
              value={q.imageUrl || ''}
              onChange={(e) => onQuestionChange(qIndex, 'imageUrl', e.target.value)}
              fullWidth
              size="small"
              sx={lightTextFieldStyle}
              placeholder="/images/stream-selector/img-012.png"
              helperText="Leave empty for text-only questions. Served from frontend/public."
            />
            {q.imageUrl ? (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#111827', borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'inline-block', maxWidth: '100%' }}>
                <img src={resolveTestImage(q.imageUrl)} alt="Question preview" style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'scale-down', display: 'block' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </Box>
            ) : null}
          </Box>

          <TextField
            label="Scenario (context line shown above question)"
            value={q.scenario || ''}
            onChange={(e) => onQuestionChange(qIndex, 'scenario', e.target.value)}
            fullWidth
            size="small"
            sx={{ ...lightTextFieldStyle, bgcolor: 'rgba(255,255,255,0.02)' }}
            helperText="Optional — a short real-world situation the question is set in."
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 140, ...lightTextFieldStyle }}>
              <InputLabel id={`diff-label-${qIndex}`}>Difficulty</InputLabel>
              <Select
                labelId={`diff-label-${qIndex}`}
                value={q.difficulty || 'intermediate'}
                label="Difficulty"
                onChange={(e) => onQuestionChange(qIndex, 'difficulty', e.target.value)}
                sx={{ '& .MuiSelect-icon': { color: '#6b7280' } }}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Tags (comma-separated)"
              value={Array.isArray(q.tags) ? q.tags.join(', ') : ''}
              onChange={(e) => onQuestionChange(qIndex, 'tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              fullWidth
              size="small"
              sx={lightTextFieldStyle}
              helperText="e.g. logical-reasoning, spatial, verbal"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Options & Scoring Matrix</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {q.options.map((opt, optIndex) => (
                <Box key={optIndex} sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <TextField
                      label={`Option ${optIndex + 1}`}
                      value={opt.text}
                      onChange={(e) => onOptionChange(qIndex, optIndex, 'text', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ ...lightTextFieldStyle, flex: '1 1 220px' }}
                    />
                    <TextField
                      label="Option image URL (for image choices)"
                      value={opt.imageUrl || ''}
                      onChange={(e) => onOptionChange(qIndex, optIndex, 'imageUrl', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ ...lightTextFieldStyle, flex: '1 1 220px' }}
                      placeholder="/images/stream-selector/img-016.png"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                    {opt.imageUrl ? (
                      <Box sx={{ p: 1.5, bgcolor: '#111827', borderRadius: 2, border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'inline-block' }}>
                        <img src={resolveTestImage(opt.imageUrl)} alt={`Option ${optIndex + 1} preview`} style={{ maxHeight: 130, maxWidth: 260, objectFit: 'scale-down', display: 'block' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </Box>
                    ) : null}
                    <TextField
                      label="Explanation (shown after answering)"
                      value={opt.explanation || ''}
                      onChange={(e) => onOptionChange(qIndex, optIndex, 'explanation', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ ...lightTextFieldStyle, bgcolor: 'rgba(255,255,255,0.02)' }}
                      helperText="Why this option is correct / what it measures."
                    />
                    <Tooltip title={isScored ? 'Mark this option as the correct answer' : 'Switch the test to Scored mode to set a correct answer'}>
                      <span>
                        <IconButton
                          onClick={() => onSetCorrectOption(qIndex, optIndex)}
                          disabled={!isScored}
                          size="small"
                          aria-label={`Mark option ${optIndex + 1} as correct`}
                          sx={{
                            alignSelf: 'flex-start', mt: 0.5,
                            color: q.correctOptionIndex === optIndex && isScored ? '#34d399' : 'rgba(255,255,255,0.35)',
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton onClick={() => onDeleteOption(qIndex, optIndex)} size="small" sx={{ alignSelf: 'flex-start', mt: 0.5, color: '#f43f5e' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {isScored && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 1.5,
                        fontWeight: 700,
                        color: q.correctOptionIndex === optIndex ? '#34d399' : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {q.correctOptionIndex === optIndex ? '\u2713 Correct answer' : 'Tap the check to key this answer'}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 1.5, fontWeight: 600 }}>
                    Points assigned per category for selecting this option:
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5 }}>
                    {categories.map(cat => (
                      <TextField
                        key={cat}
                        label={cat}
                        type="number"
                        value={opt.points?.[cat] !== undefined ? opt.points[cat] : ''}
                        onChange={(e) => onPointChange(qIndex, optIndex, cat, e.target.value)}
                        size="small"
                        sx={lightTextFieldStyle}
                      />
                    ))}
                    {categories.length === 0 && (
                      <Typography variant="caption" sx={{ color: '#f43f5e', gridColumn: '1 / -1' }}>Add categories first to assign points.</Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            <Button
              size="small"
              onClick={() => onAddOption(qIndex)}
              sx={{ mt: 2, color: '#111827', fontWeight: 700 }}
            >
              + Add Option
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
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

const emptyFormMeta = {
  name: '', slug: '', description: '', instructions: '', categories: [],
  timeLimit: null, passingScore: null, introMessage: '',
  scoringMode: 'profile', shuffleQuestions: false, showExplanations: true,
  allowRetake: true, retakeCooldownMin: 10,
};
const emptyQuestion = { question: '', options: [{ text: '', points: {} }, { text: '', points: {} }], scenario: '', difficulty: 'intermediate', tags: [], explanation: '', correctOptionIndex: null };
const emptySection = { title: '', description: '', timeLimitMinutes: null, shuffle: false, questionIndices: [] };

const TestsManagement = () => {
  const [formMeta, setFormMeta] = useState(emptyFormMeta);
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Custom Confirmation Dialogs
  const [deleteTestDialog, setDeleteTestDialog] = useState(null);
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState(null);

  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [drawerReady, setDrawerReady] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Pagination State
  const [questionPage, setQuestionPage] = useState(1);
  const questionsPerPage = 20;

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [sectionInput, setSectionInput] = useState('');

  // Memoized Categories List
  const availableCategories = useMemo(() => {
    const cats = new Set();
    tests.forEach(test => {
      if (test.categories && Array.isArray(test.categories)) {
        test.categories.forEach(cat => cats.add(cat));
      }
    });
    return Array.from(cats).sort();
  }, [tests]);

  // Memoized Processed Data (Filtered & Sorted)
  const processedTests = useMemo(() => {
    let filtered = tests;

    // Search Filter
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        test.name?.toLowerCase().includes(lowerQuery) ||
        test.description?.toLowerCase().includes(lowerQuery)
      );
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(test => 
        test.categories?.includes(categoryFilter)
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [tests, searchTerm, categoryFilter, sortOrder]);

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
    setQuestionPage(1);
    if (test) {
      setFormMeta({
        name: test.name || '',
        slug: test.slug || '',
        description: test.description || '',
        instructions: test.instructions || '',
        categories: test.categories || [],
        timeLimit: test.timeLimit ?? null,
        passingScore: test.passingScore ?? null,
        introMessage: test.introMessage || '',
        scoringMode: test.scoringMode === 'scored' ? 'scored' : 'profile',
        shuffleQuestions: Boolean(test.shuffleQuestions),
        showExplanations: test.showExplanations !== false,
        allowRetake: test.allowRetake != null ? Boolean(test.allowRetake) : true,
        retakeCooldownMin: test.retakeCooldownMin ?? 10,
      });
      setQuestions(test.questions || []);
      setSections(test.sections && test.sections.length > 0 ? test.sections.map((s, i) => ({ ...s, _idx: i })) : []);
      setEditingId(test._id);

      const initialExpanded = {};
      if (test.questions?.length > 0) initialExpanded[0] = true;
      setExpandedQuestions(initialExpanded);
    } else {
      setFormMeta(emptyFormMeta);
      setQuestions([]);
      setSections([]);
      setEditingId(null);
      setExpandedQuestions({});
    }
    setTabValue(0);
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
      setSections([]);
      setEditingId(null);
      setCategoryInput('');
      setSectionInput('');
      setDrawerReady(false);
      setTabValue(0);
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
      // Deep copy: a shallow spread handed every new question the *same* options
      // array and option objects, so two blank questions started out aliased.
      const fresh = {
        ...emptyQuestion,
        options: emptyQuestion.options.map(o => ({ ...o, points: { ...o.points } })),
      };
      const next = [...prev, fresh];
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



  const handleDuplicateQuestion = useCallback((qIndex) => {
    setQuestions(prev => {
      const next = [...prev];
      const questionToDuplicate = { ...next[qIndex] };
      questionToDuplicate.options = questionToDuplicate.options.map(opt => ({
        ...opt,
        points: { ...opt.points }
      }));
      next.splice(qIndex + 1, 0, questionToDuplicate);
      return next;
    });
    setExpandedQuestions(prev => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        const idx = Number(key);
        if (idx <= qIndex) next[idx] = val;
        else next[idx + 1] = val;
      });
      next[qIndex + 1] = true;
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

    // Sections store indices into `questions`, so swapping two questions has to
    // swap them here too or a section starts pointing at its neighbour.
    setSections(prev => prev.map(sec => ({
      ...sec,
      questionIndices: (sec.questionIndices || []).map(i =>
        i === qIndex ? newIndex : i === newIndex ? qIndex : i),
    })));
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

  /* ─── Section handlers ─────────────────────────────────────────────────────── */

  const handleAddSection = useCallback(() => {
    setSections(prev => {
      const next = [...prev, { ...emptySection, _idx: prev.length }];
      return next;
    });
  }, []);

  const handleSectionChange = useCallback((sIndex, field, value) => {
    setSections(prev => {
      const next = [...prev];
      next[sIndex] = { ...next[sIndex], [field]: value };
      return next;
    });
  }, []);

  const handleSectionToggleQuestion = useCallback((sIndex, qIdx) => {
    setSections(prev => {
      const next = [...prev];
      const sec = { ...next[sIndex] };
      const list = [...(sec.questionIndices || [])];
      const pos = list.indexOf(qIdx);
      if (pos === -1) list.push(qIdx);
      else list.splice(pos, 1);
      sec.questionIndices = list;
      next[sIndex] = sec;
      return next;
    });
  }, []);

  const handleDeleteSection = useCallback((sIndex) => {
    setSections(prev => prev.filter((_, i) => i !== sIndex));
  }, []);

  const handleMoveSection = useCallback((sIndex, direction) => {
    const newIndex = sIndex + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    setSections(prev => {
      const next = [...prev];
      const temp = next[sIndex];
      next[sIndex] = next[newIndex];
      next[newIndex] = temp;
      next.forEach((s, i) => { if (s._idx == null || s._idx !== i) { s._idx = i; } });
      return next;
    });
  }, [sections.length]);;

  const handleDeleteQuestion = useCallback((qIndex) => {
    setDeleteQuestionDialog(qIndex);
  }, []);

  const confirmDeleteQuestion = useCallback(() => {
    if (deleteQuestionDialog === null) return;
    setQuestions(prev => prev.filter((_, i) => i !== deleteQuestionDialog));
    // Drop the deleted index from every section and shift the ones after it
    // down, so the section membership still refers to the right questions.
    setSections(prev => prev.map(sec => ({
      ...sec,
      questionIndices: (sec.questionIndices || [])
        .filter(i => i !== deleteQuestionDialog)
        .map(i => (i > deleteQuestionDialog ? i - 1 : i)),
    })));
    setExpandedQuestions(prev => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        const idx = Number(key);
        if (idx < deleteQuestionDialog) next[idx] = val;
        else if (idx > deleteQuestionDialog) next[idx - 1] = val;
      });
      return next;
    });
    setDeleteQuestionDialog(null);
  }, [deleteQuestionDialog]);

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

  /* Single-answer keying for scored tests: selecting an option replaces any
     previous key on that question (one key per item).
     Clicking the current key clears it again. */
  const handleSetCorrectOption = useCallback((qIndex, optIndex) => {
    setQuestions(prev => {
      const next = [...prev];
      const current = next[qIndex].correctOptionIndex;
      next[qIndex] = {
        ...next[qIndex],
        correctOptionIndex: current === optIndex ? null : optIndex,
      };
      return next;
    });
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
      const payload = { ...formMeta, questions, sections };
      if (editingId) {
        await adminUpdateTest(editingId, payload);
      } else {
        await adminCreateTest(payload);
      }
      fetchTests();
      setOpenDrawer(false);
      setFormMeta(emptyFormMeta);
      setQuestions([]);
      setSections([]);
      setEditingId(null);
      setSuccess(isEditing ? 'Test updated!' : 'Test created!');
    } catch (err) {
      setError(err.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  /* Publishing is a real control, not a hidden DB flag: the catalogue and the
     runner both honour `isActive`, so the list has to be able to set it. The
     chip in the Format column toggles it in place, optimistically. */
  const handleToggleActive = async (test) => {
    const nextActive = test.isActive === false;
    setTests(prev => prev.map(t => (t._id === test._id ? { ...t, isActive: nextActive } : t)));
    try {
      await adminUpdateTest(test._id, { isActive: nextActive });
      setSuccess(nextActive ? 'Test published' : 'Test unpublished');
    } catch (err) {
      setTests(prev => prev.map(t => (t._id === test._id ? { ...t, isActive: test.isActive } : t)));
      setError(err.message || 'Failed to change test status');
    }
  };

  const handleDelete = (id) => {
    setDeleteTestDialog(id);
  };

  const confirmDeleteTest = async () => {
    if (!deleteTestDialog) return;
    setDeletingId(deleteTestDialog);
    try {
      await adminDeleteTest(deleteTestDialog);
      fetchTests();
      setSuccess('Test deleted');
    } catch (err) {
      setError(err.message || 'Failed to delete test');
    } finally {
      setDeletingId(null);
      setDeleteTestDialog(null);
    }
  };

  /* ─── Question-bank quality model ────────────────────────────────────────
     One pass over the questions produces both the advisory panel and the hard
     validation, so the two can never disagree about whether the bank is
     shippable. */
  const bankQuality = useMemo(() => {
    const counts = { beginner: 0, intermediate: 0, advanced: 0 };
    const issues = { unkeyed: [], unweighted: [], noExplanation: [], duplicateOptions: [] };
    let optionsTotal = 0;
    let tagged = 0;
    let withScenario = 0;
    let withExplanation = 0;
    let keyed = 0;

    questions.forEach((q, i) => {
      const tier = counts[q.difficulty] !== undefined ? q.difficulty : 'intermediate';
      counts[tier]++;
      optionsTotal += q.options?.length || 0;
      if (q.tags?.length) tagged++;
      if (q.scenario?.trim()) withScenario++;
      if (q.explanation?.trim()) withExplanation++;

      if (q.correctOptionIndex != null) keyed++;
      else issues.unkeyed.push(i + 1);

      if (!q.options?.some(opt => opt.points && Object.keys(opt.points).length > 0)) {
        issues.unweighted.push(i + 1);
      }

      const texts = (q.options || []).map(o => (o.text || '').trim().toLowerCase()).filter(Boolean);
      if (new Set(texts).size !== texts.length) issues.duplicateOptions.push(i + 1);
      if (q.options?.some(o => o.text?.trim()) && !q.explanation?.trim()) issues.noExplanation.push(i + 1);
    });

    const total = questions.length || 1;
    const tiersUsed = ['beginner', 'intermediate', 'advanced'].filter(t => counts[t] > 0).length;
    return {
      counts,
      issues,
      keyed,
      avgOptions: questions.length ? Math.round((optionsTotal / questions.length) * 10) / 10 : 0,
      difficultyCoverage: tiersUsed,
      scenarioRate: Math.round((withScenario / total) * 100),
      taggingRate: Math.round((tagged / total) * 100),
      explanationRate: Math.round((withExplanation / total) * 100),
    };
  }, [questions]);

  const validationError = useMemo(() => {
    if (formMeta.name.trim() === '') return 'Test name is required.';
    if (formMeta.slug.trim() === '') return 'Slug is required.';
    if (questions.length === 0) return 'Add at least one question.';
    for (let i = 0; i < questions.length; i++) {
      if (!(questions[i].question || '').trim() && !questions[i].imageUrl) return `Question ${i + 1} text is empty.`;
      if (questions[i].options.length < 2) return `Question ${i + 1} needs at least 2 options.`;
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!(questions[i].options[j].text || '').trim() && !questions[i].options[j].imageUrl) return `Option ${j + 1} in Question ${i + 1} is empty.`;
      }
    }
    // Mode-specific gates, mirroring the API's own checks so the failure shows
    // up next to the field instead of as a 400 after saving.
    if (formMeta.scoringMode === 'scored') {
      if (formMeta.passingScore == null) return 'Scored tests need a passing score (%).';
      if (bankQuality.issues.unkeyed.length > 0) {
        return `Set the correct answer for question ${bankQuality.issues.unkeyed[0]} — scored tests need a key for every item.`;
      }
    } else if (bankQuality.issues.unweighted.length > 0) {
      return `Question ${bankQuality.issues.unweighted[0]} has no category points. A profile test needs weights to rank categories.`;
    }
    return null;
  }, [formMeta.name, formMeta.slug, formMeta.passingScore, formMeta.scoringMode, questions, bankQuality]);

  const isValid = validationError === null;

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress size={32} sx={{ color: '#111827' }} />
    </Box>
  );

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', color: '#111827', fontWeight: 700 }}>
            Tests Management
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
            Manage psychometric assessment templates, scoring vectors, and questions
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
            px: 3, py: 1.2, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '0.92rem',
            boxShadow: '0 4px 14px rgba(232, 184, 109, 0.3)'
          }}
        >
          Add New Test
        </Button>
      </Box>

      <FormAlerts error={error} success={success} onDismissError={() => setError('')} onDismissSuccess={() => setSuccess('')} />

      {/* Filter and Sort Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <TextField
          placeholder="Search tests by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            ...lightTextFieldStyle,
            minWidth: { xs: '100%', md: '300px' },
            flexGrow: 1
          }}
        />

        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 160, ...lightTextFieldStyle }}>
            <InputLabel id="category-filter-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon fontSize="small" /> Category
            </InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{
                '& .MuiSelect-icon': { color: '#6b7280' }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#0f172a',
                    border: '1px solid rgba(0,0,0,0.06)',
                    '& .MuiMenuItem-root': { color: 'rgba(255,255,255,0.9)' },
                    '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                    '& .Mui-selected': { bgcolor: 'rgba(232, 184, 109, 0.2) !important', color: '#111827' }
                  }
                }
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {availableCategories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160, ...lightTextFieldStyle }}>
            <InputLabel id="sort-order-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SortIcon fontSize="small" /> Sort By
            </InputLabel>
            <Select
              labelId="sort-order-label"
              value={sortOrder}
              label="Sort By"
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{
                '& .MuiSelect-icon': { color: '#6b7280' }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: '#0f172a',
                    border: '1px solid rgba(0,0,0,0.06)',
                    '& .MuiMenuItem-root': { color: 'rgba(255,255,255,0.9)' },
                    '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                    '& .Mui-selected': { bgcolor: 'rgba(232, 184, 109, 0.2) !important', color: '#111827' }
                  }
                }
              }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="name_asc">Name (A-Z)</MenuItem>
              <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          bgcolor: 'var(--color-paper)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
        }}
      >
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Categories</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Format</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Questions</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedTests.map((test) => (
              <TableRow key={test._id} sx={{ '&:hover': { bgcolor: '#ffffff' } }}>
                <TableCell sx={{ fontWeight: 600, color: '#111827', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{test.name}</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>{test.description || '—'}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {test.categories?.map((cat, i) => (
                      <Chip key={i} label={cat} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 600 }} />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Chip
                      label={test.difficulty || 'mixed'}
                      size="small"
                      sx={{
                        ...(DIFFICULTY_STYLE[test.difficulty] || { bg: 'rgba(255,255,255,0.08)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.15)' }),
                        fontWeight: 700, textTransform: 'capitalize', fontSize: '0.65rem',
                      }}
                    />
                    <Chip
                      label={test.scoringMode === 'scored' ? 'scored' : 'profile'}
                      size="small"
                      sx={{ bgcolor: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.3)', fontWeight: 700, fontSize: '0.65rem' }}
                    />
                    <Tooltip title="Click to publish / unpublish">
                      <Chip
                        label={test.isActive === false ? 'inactive' : 'active'}
                        onClick={() => handleToggleActive(test)}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer',
                          bgcolor: test.isActive === false ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                          color: test.isActive === false ? '#f87171' : '#34d399',
                          border: `1px solid ${test.isActive === false ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
                        }}
                      />
                    </Tooltip>
                    {test.timeLimit ? (
                      <Chip label={`${test.timeLimit} min`} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.02)', color: '#6b7280', border: '1px solid #e5e7eb', fontWeight: 700, fontSize: '0.65rem' }} />
                    ) : null}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <Chip label={test.questions?.length || 0} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 700 }} />
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <IconButton onClick={() => handleOpen(test)} size="small" sx={{ color: '#111827', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(test._id)} disabled={deletingId === test._id} size="small" sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
                    {deletingId === test._id ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon fontSize="small" />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            
            {tests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <ListAltIcon sx={{ fontSize: 54, color: '#111827', opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600 }}>No tests available</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Create your first psychometric test to get started.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {tests.length > 0 && processedTests.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <SearchIcon sx={{ fontSize: 54, color: '#111827', opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600 }}>No matching tests</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>Try adjusting your search or filters.</Typography>
                    <Button 
                      variant="outlined" 
                      onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setSortOrder('newest'); }}
                      sx={{ mt: 2, color: '#111827', borderColor: '#10b981', borderRadius: '8px' }}
                    >
                      Clear Filters
                    </Button>
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
            width: { xs: '100%', sm: 600, md: 760 },
            bgcolor: '#ffffff',
            backgroundImage: 'linear-gradient(180deg, #051c11 0%, #04140a 100%)',
            color: '#111827',
            borderLeft: '1px solid rgba(232, 184, 109, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-20px 0 80px rgba(0,0,0,0.5)'
          }
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ p: 3.5, pb: 0, bgcolor: 'rgba(5, 28, 17, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 10 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-display, "DM Serif Display", Georgia, serif)', color: '#111827', fontWeight: 700 }}>
              {editingId ? 'Edit Psychometric Test' : 'Create New Psychometric Test'}
            </Typography>
            <IconButton onClick={handleClose} sx={{ color: '#6b7280' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Tabs
            value={tabValue}
            onChange={(e, val) => setTabValue(val)}
            sx={{
              '& .MuiTab-root': { color: '#6b7280', fontWeight: 600, textTransform: 'none', fontSize: '1rem', minWidth: 120 },
              '& .Mui-selected': { color: '#e8b86d !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#e8b86d' }
            }}
          >
            <Tab label="General Info" />
            <Tab label={`Questions (${questions.length})`} />
            <Tab label={`Sections (${sections.length})`} />
          </Tabs>
        </Box>

        {/* Drawer Content */}
        <Box sx={{ p: 3.5, flexGrow: 1, overflowY: 'auto' }}>
          {!drawerReady ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress size={32} sx={{ color: '#111827' }} />
            </Box>
          ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

            {tabValue === 0 && (
              <>
                {/* General Info */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>General Test Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Test Name"
                  required
                  value={formMeta.name}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={lightTextFieldStyle}
                />
                <TextField
                  label="Slug (e.g. ideal-career-test)"
                  required
                  value={formMeta.slug}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, slug: e.target.value }))}
                  fullWidth
                  size="small"
                  helperText="Used in the URL. Must be unique and hyphen-separated."
                  sx={lightTextFieldStyle}
                />
                <TextField
                  label="Description"
                  value={formMeta.description}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                  sx={lightTextFieldStyle}
                />
              </Box>
            </Box>

            {/* Categories Section */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>Categories / Vectors</Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
                Define the personality types, traits, or career paths this test measures.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {formMeta.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onDelete={() => handleDeleteCategory(category)}
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827', border: '1px solid rgba(232, 184, 109, 0.3)', fontWeight: 700, borderRadius: 2 }}
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
                sx={lightTextFieldStyle}
              />
            </Box>

            {/* Test Settings Section */}
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>Test Settings</Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
                Configure time limits, scoring, and test behaviour.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Mode picks the whole scoring model, so it leads the section. */}
                <FormControl fullWidth size="small" sx={lightTextFieldStyle}>
                  <InputLabel id="scoring-mode-label">Scoring Mode</InputLabel>
                  <Select
                    labelId="scoring-mode-label"
                    value={formMeta.scoringMode}
                    label="Scoring Mode"
                    onChange={(e) => setFormMeta(prev => ({ ...prev, scoringMode: e.target.value }))}
                    sx={{ '& .MuiSelect-icon': { color: '#6b7280' } }}
                  >
                    <MenuItem value="profile">Profile — points across categories (no right answers)</MenuItem>
                    <MenuItem value="scored">Scored — keyed answers, marked pass/fail</MenuItem>
                  </Select>
                  <Typography variant="caption" sx={{ color: '#9ca3af', mt: 1 }}>
                    {formMeta.scoringMode === 'scored'
                      ? 'Every question needs a correct answer. Results carry a score, a percentage and a pass/fail verdict.'
                      : 'Every option needs category points. Results rank the categories and recommend a direction.'}
                  </Typography>
                </FormControl>

                <TextField
                  label="Time Limit (minutes, optional)"
                  type="number"
                  value={formMeta.timeLimit ?? ''}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, timeLimit: e.target.value ? Number(e.target.value) : null }))}
                  fullWidth
                  size="small"
                  helperText="Leave blank for no timer. When set, users see a countdown."
                  sx={lightTextFieldStyle}
                />
                <TextField
                  label={formMeta.scoringMode === 'scored' ? 'Passing Score (percentage, required)' : 'Passing Score (percentage, optional)'}
                  type="number"
                  required={formMeta.scoringMode === 'scored'}
                  value={formMeta.passingScore ?? ''}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, passingScore: e.target.value ? Number(e.target.value) : null }))}
                  fullWidth
                  size="small"
                  helperText={formMeta.scoringMode === 'scored'
                    ? 'Learners scoring at or above this are marked as passed.'
                    : 'Only meaningful for scored tests — shown in analytics otherwise.'}
                  sx={lightTextFieldStyle}
                />
                <TextField
                  label="Intro Message"
                  value={formMeta.introMessage}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, introMessage: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                  helperText="Shown on the warm-up screen before question 1."
                  sx={lightTextFieldStyle}
                />
                <TextField
                  label="Instructions"
                  value={formMeta.instructions}
                  onChange={(e) => setFormMeta(prev => ({ ...prev, instructions: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                  helperText="Rules and expectations shown on the warm-up screen."
                  sx={lightTextFieldStyle}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formMeta.shuffleQuestions}
                        onChange={(e) => setFormMeta(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                        size="small"
                        sx={{ color: '#6b7280', '&.Mui-checked': { color: '#111827' } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Shuffle question order per attempt</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formMeta.showExplanations}
                        onChange={(e) => setFormMeta(prev => ({ ...prev, showExplanations: e.target.checked }))}
                        size="small"
                        sx={{ color: '#6b7280', '&.Mui-checked': { color: '#111827' } }}
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Show explanations on the results screen</Typography>}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 4, pt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formMeta.allowRetake}
                          onChange={(e) => setFormMeta(prev => ({ ...prev, allowRetake: e.target.checked }))}
                          size="small"
                          sx={{ color: '#6b7280', '&.Mui-checked': { color: '#111827' } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Allow retakes</Typography>}
                    />
                  </Box>
                  <TextField
                    label="Retake cooldown (minutes)"
                    type="number"
                    value={formMeta.retakeCooldownMin ?? 10}
                    onChange={(e) => setFormMeta(prev => ({ ...prev, retakeCooldownMin: Number(e.target.value) || 10 }))}
                    size="small"
                    sx={{ minWidth: 140, ...lightTextFieldStyle }}
                    disabled={!formMeta.allowRetake}
                  />
                </Box>
              </Box>
            </Box>
              </>
            )}

            {tabValue === 1 && (
              <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(0,0,0,0.06)' }}>
                {/* Questions Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center' }}>
                  Questions
                  <Chip label={questions.length} size="small" sx={{ ml: 1, bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#111827', fontWeight: 700 }} />
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Expand All">
                    <IconButton size="small" onClick={() => toggleAllQuestions(true)} sx={{ color: '#111827' }}>
                      <UnfoldMoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Collapse All">
                    <IconButton size="small" onClick={() => toggleAllQuestions(false)} sx={{ color: '#111827' }}>
                      <UnfoldLessIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddQuestion}
                    sx={{ borderRadius: '10px', borderColor: '#10b981', color: '#111827', '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.1)' } }}
                  >
                    Add Question
                  </Button>
                </Box>
              </Box>

              {/* Bank quality at a glance — difficulty spread, coverage and the
                  advisories that decide whether this test is worth taking. */}
              {questions.length > 0 && (
                <Box sx={{ mb: 3, p: 2.5, bgcolor: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {Object.entries(bankQuality.counts).map(([tier, count]) => (
                      <Chip
                        key={tier}
                        label={`${count} ${tier}`}
                        size="small"
                        sx={{ ...(DIFFICULTY_STYLE[tier] || DIFFICULTY_STYLE.intermediate), fontWeight: 700, fontSize: '0.68rem', textTransform: 'capitalize' }}
                      />
                    ))}
                    <Chip label={`avg ${bankQuality.avgOptions} options`} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontWeight: 700, fontSize: '0.68rem' }} />
                    <Chip label={`${bankQuality.scenarioRate}% scenario-led`} size="small" sx={{ bgcolor: 'rgba(167,139,250,0.15)', color: '#c4b5fd', fontWeight: 700, fontSize: '0.68rem' }} />
                    <Chip label={`${bankQuality.explanationRate}% with rationale`} size="small" sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#6ee7b7', fontWeight: 700, fontSize: '0.68rem' }} />
                    {formMeta.scoringMode === 'scored' && (
                      <Chip label={`${bankQuality.keyed}/${questions.length} keyed`} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#111827', fontWeight: 700, fontSize: '0.68rem' }} />
                    )}
                  </Box>
                  {(bankQuality.difficultyCoverage < 2 || bankQuality.issues.unkeyed.length > 0 || bankQuality.issues.duplicateOptions.length > 0 || bankQuality.explanationRate < 60) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {bankQuality.difficultyCoverage < 2 && (
                        <Typography variant="caption" sx={{ color: '#111827' }}>• Every question is the same difficulty — a mixed bank reads as more credible and measures more.</Typography>
                      )}
                      {formMeta.scoringMode === 'scored' && bankQuality.issues.unkeyed.length > 0 && (
                        <Typography variant="caption" sx={{ color: '#f87171' }}>• Unkeyed questions: {bankQuality.issues.unkeyed.join(', ')}</Typography>
                      )}
                      {formMeta.scoringMode === 'profile' && bankQuality.issues.unweighted.length > 0 && (
                        <Typography variant="caption" sx={{ color: '#f87171' }}>• Questions with no category points: {bankQuality.issues.unweighted.join(', ')}</Typography>
                      )}
                      {bankQuality.issues.duplicateOptions.length > 0 && (
                        <Typography variant="caption" sx={{ color: '#f87171' }}>• Duplicate option text in: {bankQuality.issues.duplicateOptions.join(', ')}</Typography>
                      )}
                      {bankQuality.explanationRate < 60 && (
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>• Only {bankQuality.explanationRate}% of questions carry a rationale — explanations are what make a result feel earned.</Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {questions.slice((questionPage - 1) * questionsPerPage, questionPage * questionsPerPage).map((q, idx) => {
                  const qIndex = (questionPage - 1) * questionsPerPage + idx;
                  return (
                  <QuestionEditor
                    key={`${q._id || qIndex}-${qIndex}`}
                    q={q}
                    qIndex={qIndex}
                    totalQuestions={questions.length}
                    categories={formMeta.categories}
                    expanded={!!expandedQuestions[qIndex]}
                    scoringMode={formMeta.scoringMode}
                    onChangeExpansion={handleToggleExpansion}
                    onQuestionChange={handleQuestionChange}
                    onDuplicateQuestion={handleDuplicateQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onMoveQuestion={handleMoveQuestion}
                    onAddOption={handleAddOption}
                    onOptionChange={handleOptionChange}
                    onDeleteOption={handleDeleteOption}
                    onPointChange={handlePointChange}
                    onSetCorrectOption={handleSetCorrectOption}
                  />
                  );
                })}
              </Box>
              {questions.length > questionsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={Math.ceil(questions.length / questionsPerPage)} 
                    page={questionPage} 
                    onChange={(e, value) => setQuestionPage(value)} 
                    sx={{
                      '& .MuiPaginationItem-root': { color: '#6b7280' },
                      '& .Mui-selected': { bgcolor: 'rgba(232, 184, 109, 0.2) !important', color: '#111827' }
                    }}
                  />
                </Box>
              )}
            </Box>
            )}

            {tabValue === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Sections header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>Sections</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Group questions into timed sections. Leave empty for a flat test.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddSection}
                    sx={{ borderRadius: '10px', borderColor: '#10b981', color: '#111827', '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.1)' } }}
                  >
                    Add Section
                  </Button>
                </Box>

                {sections.length === 0 ? (
                  <Box sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)', textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                      No sections yet. Add a section to break the test into timed parts (e.g. "Verbal Reasoning — 10 min").
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {sections.map((sec, sIndex) => (
                      <Accordion key={sIndex} disableGutters
                        expanded={expandedQuestions[`sec-${sIndex}`] || false}
                        onChange={(e, isExpanded) => setExpandedQuestions(prev => ({ ...prev, [`sec-${sIndex}`]: isExpanded }))}
                        TransitionProps={{ unmountOnExit: true }}
                        sx={{
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '16px !important',
                          '&:before': { display: 'none' },
                          overflow: 'hidden',
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#111827' }} />} sx={{ bgcolor: 'rgba(0,0,0,0.02)', '&.Mui-expanded': { borderBottom: '1px solid rgba(0,0,0,0.05)' } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                            <Typography sx={{ fontWeight: 600, color: '#111827' }}>
                              {sec.title || `Section ${sIndex + 1}`} ({sec.questionIndices.length} questions)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => handleMoveSection(sIndex, -1)} disabled={sIndex === 0} sx={{ color: '#6b7280' }}><ArrowUpIcon fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleMoveSection(sIndex, 1)} disabled={sIndex === sections.length - 1} sx={{ color: '#6b7280' }}><ArrowDownIcon fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => handleDeleteSection(sIndex)} sx={{ color: '#f43f5e' }}><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3, bgcolor: 'transparent' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                              label="Section Title"
                              value={sec.title}
                              onChange={(e) => handleSectionChange(sIndex, 'title', e.target.value)}
                              fullWidth size="small" sx={lightTextFieldStyle}
                            />
                            <TextField
                              label="Description (optional)"
                              value={sec.description}
                              onChange={(e) => handleSectionChange(sIndex, 'description', e.target.value)}
                              fullWidth size="small" sx={lightTextFieldStyle}
                            />
                            <TextField
                              label="Time Limit (minutes, optional)"
                              type="number"
                              value={sec.timeLimitMinutes ?? ''}
                              onChange={(e) => handleSectionChange(sIndex, 'timeLimitMinutes', e.target.value ? Number(e.target.value) : null)}
                              fullWidth size="small" sx={lightTextFieldStyle}
                              helperText="Leave blank to inherit the test's global timer."
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={sec.shuffle || false}
                                  onChange={(e) => handleSectionChange(sIndex, 'shuffle', e.target.checked)}
                                  size="small"
                                  sx={{ color: '#6b7280', '&.Mui-checked': { color: '#111827' } }}
                                />
                              }
                              label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Shuffle questions within this section</Typography>}
                            />

                            {/* Question picker */}
                            <Box>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 1.5, fontWeight: 600 }}>
                                Questions in this section ({sec.questionIndices.length} selected):
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {questions.length === 0 ? (
                                  <Typography variant="caption" sx={{ color: '#f87171' }}>Add questions first (Questions tab) before assigning them to sections.</Typography>
                                ) : (
                                  <>
                                    {questions.slice((questionPage - 1) * questionsPerPage, questionPage * questionsPerPage).map((q, idx) => {
                                      const qIdx = (questionPage - 1) * questionsPerPage + idx;
                                      return (
                                      <Box key={qIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <Checkbox
                                          checked={sec.questionIndices.includes(qIdx)}
                                          onChange={() => handleSectionToggleQuestion(sIndex, qIdx)}
                                          size="small"
                                          sx={{ color: '#6b7280', '&.Mui-checked': { color: '#111827' } }}
                                        />
                                        <Typography sx={{ flex: 1, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {q.question ? q.question.substring(0, 70) + (q.question.length > 70 ? '…' : '') : `Question ${qIdx + 1}`}
                                        </Typography>
                                        <Chip
                                          label={q.difficulty || 'intermediate'}
                                          size="small"
                                          sx={{
                                            bgcolor: (q.difficulty === 'beginner' ? 'rgba(52,211,153,0.15)' : q.difficulty === 'advanced' ? 'rgba(244,63,94,0.15)' : 'rgba(251,191,36,0.15)'),
                                            color: (q.difficulty === 'beginner' ? '#34d399' : q.difficulty === 'advanced' ? '#f43f5e' : '#fbbf24'),
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            fontSize: '0.65rem',
                                            height: 18,
                                          }}
                                        />
                                      </Box>
                                      );
                                    })}
                                    {questions.length > questionsPerPage && (
                                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Pagination 
                                          count={Math.ceil(questions.length / questionsPerPage)} 
                                          page={questionPage} 
                                          onChange={(e, value) => setQuestionPage(value)} 
                                          size="small"
                                          sx={{
                                            '& .MuiPaginationItem-root': { color: '#6b7280' },
                                            '& .Mui-selected': { bgcolor: 'rgba(232, 184, 109, 0.2) !important', color: '#111827' }
                                          }}
                                        />
                                      </Box>
                                    )}
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}

                {/* Section list summary */}
                {sections.length > 0 && tabValue === 2 && (
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                      Total questions assigned: {sections.reduce((sum, s) => sum + (s.questionIndices?.length || 0), 0)} / {questions.length}
                    </Typography>
                    {sections.length > 0 && questions.length > 0 && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', mt: 0.5 }}>
                        {questions.length - sections.reduce((sum, s) => sum + (s.questionIndices?.length || 0), 0)} question(s) are not in any section — they will appear in flat mode.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
          )}

        </Box>

        {/* Drawer Footer */}
        <Box sx={{ p: 3, bgcolor: 'rgba(5, 28, 17, 0.95)', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, zIndex: 10 }}>
          <Box>
            {!isValid && (
              <Typography variant="body2" sx={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningIcon fontSize="small" /> {validationError}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={handleClose} sx={{ color: '#6b7280', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!isValid || saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
              sx={{
                bgcolor: '#111827',
                color: '#ffffff',
                borderRadius: '10px',
                px: 4,
                fontWeight: 700,
                '&:hover': { bgcolor: '#111827' },
                '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
              }}
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Test'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Test Dialog */}
      <Dialog open={!!deleteTestDialog} onClose={() => setDeleteTestDialog(null)} PaperProps={{ sx: { bgcolor: '#0f172a', color: '#111827', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' } }}>
        <DialogTitle sx={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Delete Test
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6b7280' }}>
            Are you sure you want to delete this test? This action cannot be undone and will permanently remove all associated questions and data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteTestDialog(null)} sx={{ color: '#6b7280' }}>Cancel</Button>
          <Button onClick={confirmDeleteTest} disabled={!!deletingId} sx={{ bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171', '&:hover': { bgcolor: 'rgba(248,113,113,0.2)' } }}>
            {deletingId ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={deleteQuestionDialog !== null} onClose={() => setDeleteQuestionDialog(null)} PaperProps={{ sx: { bgcolor: '#0f172a', color: '#111827', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' } }}>
        <DialogTitle sx={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Delete Question
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6b7280' }}>
            Are you sure you want to remove this question?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setDeleteQuestionDialog(null)} sx={{ color: '#6b7280' }}>Cancel</Button>
          <Button onClick={confirmDeleteQuestion} sx={{ bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171', '&:hover': { bgcolor: 'rgba(248,113,113,0.2)' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestsManagement;
