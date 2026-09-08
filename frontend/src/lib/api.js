/**
 * Paavan Setu — API client
 *
 * Thin wrapper over fetch. Every call resolves to data or throws; callers
 * decide whether to fall back to bundled defaults.
 */
import { API } from '../constants/urls';

/**
 * Resolves a stored media path to a full URL.
 * Uploaded media is stored as "/uploads/foo.png" and served by the backend,
 * but absolute URLs (e.g. a CDN or an external image) pass through untouched.
 */
export function mediaUrl(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${API.base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/* The five Gujarati-series covers shipped as ~1 MB PNGs (a 3.3 MB load on the
   Books page for a 520×800 image). WebP encodes of the same pixels are served
   next to them as `/uploads/<name>.webp`; this resolves the stored `.png` path
   to the optimized sibling when one exists, so the URL stays database-truthful
   while the browser downloads ~90% fewer bytes. Everything else passes through
   untouched. */
const OPTIMIZED_UPLOADS = {
  'myfriendganesha2.png': 'myfriendganesha2.webp',
  'krishna_pathsala2.png': 'krishna_pathsala2.webp',
  'hanumanchalisa2.png': 'hanumanchalisa2.webp',
  'kleela.png': 'kleela.webp',
  'Ramayan2.png': 'Ramayan2.webp',
};

export function mediaUrlOptimized(path) {
  const url = mediaUrl(path);
  if (!url) return url;
  const name = String(path).split('/').pop();
  const swap = OPTIMIZED_UPLOADS[name];
  return swap ? url.replace(/[^/]+\.png$/i, swap) : url;
}

async function request(url, options = {}) {
  const headers = { ...options.headers };
  // If body is FormData, let the browser set the Content-Type with boundary
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (proxy error page, 502, etc.)
  }

  if (!res.ok || (body && body.success === false)) {
    const message = body?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body?.data !== undefined ? body.data : body;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const getBooks = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`${API.books}${qs ? `?${qs}` : ''}`);
};

export const getBook = (slug) => request(`${API.books}/${slug}`);

export const getCategories = () => request(API.categories);

export const getAuthors = () => request(API.authors);

export const getSettings = () => request(API.settings);

export const submitContact = (payload) =>
  request(API.contact, { method: 'POST', body: JSON.stringify(payload) });

export const createBooking = (payload) =>
  request(API.bookings, { method: 'POST', body: JSON.stringify(payload) });

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const createOrder = (payload) =>
  request(`${API.orders}/create-order`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyPayment = (payload) =>
  request(`${API.orders}/verify-payment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const reportPaymentFailure = (payload) =>
  request(`${API.orders}/payment-failure`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).catch(() => null); // Best-effort telemetry; never block the UI on it.

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminToken = () => localStorage.getItem('adminToken');

export function adminRequest(path, options = {}) {
  return request(`${API.base}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${adminToken()}`,
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const userToken = () => localStorage.getItem('userToken');

export function userRequest(url, options = {}) {
  return request(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${userToken()}`,
    },
  });
}

export const registerUser = (payload) =>
  request(`${API.users}/register`, { method: 'POST', body: JSON.stringify(payload) });

export const loginUser = (payload) =>
  request(`${API.users}/login`, { method: 'POST', body: JSON.stringify(payload) });

export const getMe = () => userRequest(`${API.users}/me`);

// ─── Tests ────────────────────────────────────────────────────────────────────

export const submitTest = (payload) =>
  userRequest(`${API.tests}/submit`, { method: 'POST', body: JSON.stringify(payload) });

export const getMyTestResults = () => userRequest(`${API.tests}/my-results`);

export const getTests = () => request(API.tests);

export const getTestBySlug = (slug) => request(`${API.tests}/${slug}`);

export const adminGetTests = () => adminRequest('/api/tests/admin/all');

export const adminCreateTest = (payload) =>
  adminRequest('/api/tests/admin', { method: 'POST', body: JSON.stringify(payload) });

export const adminUpdateTest = (id, payload) =>
  adminRequest(`/api/tests/admin/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const adminDeleteTest = (id) =>
  adminRequest(`/api/tests/admin/${id}`, { method: 'DELETE' });

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const getTestimonials = () => request(API.testimonials);

export const adminGetTestimonials = () => adminRequest('/api/testimonials/admin');

export const adminCreateTestimonial = (payload) =>
  adminRequest('/api/testimonials', { method: 'POST', body: JSON.stringify(payload) });

export const adminUpdateTestimonial = (id, payload) =>
  adminRequest(`/api/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const adminDeleteTestimonial = (id) =>
  adminRequest(`/api/testimonials/${id}`, { method: 'DELETE' });

// ─── SEO ──────────────────────────────────────────────────────────────────────

export const getSeoSettings = () => request(`${API.base}/api/seo`);

export const adminUpdateSeoSetting = (payload) =>
  adminRequest('/api/seo', { method: 'PUT', body: JSON.stringify(payload) });

